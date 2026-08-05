/**
 * Reusable utility for performing dependency-resolution topological sorting.
 * Prevents circular reference lockups and ensures correct execution order.
 */
export class DependencySorter {
    /**
     * Topologically sorts nodes in a dependency graph.
     * 
     * EXPECTS:
     * - nodes: Array of string node IDs.
     * - options.getDependencies: Callback retrieving dependencies for a given ID.
     * - options.hasNode: Callback checking if a node ID exists in the graph.
     * 
     * GUARANTEES:
     * - Returns a topologically sorted array of node IDs.
     * - Throws an Error if a circular dependency cycle is detected, detailing the exact path.
     * - Calls options.onMissingDependency when a dependency is missing.
     * - Protects against call-stack overflow using an iterative DFS structure.
     * 
     * DOES NOT PROMISE:
     * - Deterministic sort order for nodes sharing the same dependency depth.
     * 
     * @param {string[]} nodes The array of node IDs to sort.
     * @param {Object} options Config options.
     * @param {function(string): string[]} options.getDependencies Callback to retrieve dependencies for an ID.
     * @param {function(string): boolean} options.hasNode Callback to check if a node ID exists in the graph.
     * @param {function(string, string): void} [options.onMissingDependency] Callback when a dependency is missing.
     * @param {string} [options.errorMessagePrefix] Prefix for the circular dependency error message.
     * @returns {string[]} The topologically sorted list of node IDs.
     */
    static sort(nodes, options) {
        // Validate core inputs early to prevent cryptic TypeErrors
        if (!Array.isArray(nodes)) {
            throw new TypeError("Parameter 'nodes' must be an Array.");
        }
        if (!options || typeof options !== "object") {
            throw new TypeError("Parameter 'options' must be an Object.");
        }
        if (typeof options.getDependencies !== "function") {
            throw new TypeError("options.getDependencies must be a function.");
        }
        if (typeof options.hasNode !== "function") {
            throw new TypeError("options.hasNode must be a function.");
        }
        if (options.onMissingDependency !== undefined && options.onMissingDependency !== null && typeof options.onMissingDependency !== "function") {
            throw new TypeError("options.onMissingDependency must be a function.");
        }
        if (options.errorMessagePrefix !== undefined && options.errorMessagePrefix !== null && typeof options.errorMessagePrefix !== "string") {
            throw new TypeError("options.errorMessagePrefix must be a string.");
        }

        const getDependencies = options.getDependencies;
        const hasNode = options.hasNode;
        const onMissingDependency = options.onMissingDependency || (() => {});
        const errorMessagePrefix = options.errorMessagePrefix || "Circular dependency detected: ";

        const sorted = [];
        const visited = new Set();
        
        // Helper to safely resolve and validate any ES6 iterable returned by the user callback
        const resolveDependencies = (id) => {
            const rawDeps = getDependencies(id);
            if (rawDeps === undefined || rawDeps === null) {
                return [];
            }
            if (typeof rawDeps[Symbol.iterator] !== "function") {
                throw new TypeError(`getDependencies for '${id}' returned a non-iterable value of type ${typeof rawDeps}`);
            }
            // Support Sets, Maps, Generators, Arrays, and remove duplicates in one pass
            return Array.from(new Set(rawDeps));
        };

        // Iterative DFS stack simulation to guarantee safety on QuickJS stack limits
        for (const rootId of nodes) {
            // Silently skip missing root nodes to match original behavior exactly
            if (!hasNode(rootId)) {
                continue;
            }
            if (visited.has(rootId)) {
                continue;
            }

            // Stack stores: { id: string, deps: string[], depIndex: number }
            const stack = [];
            const visitingSet = new Set();
            const visitingPath = []; // Ordered array to reconstruct cycle trail

            const rootDeps = resolveDependencies(rootId);

            stack.push({
                id: rootId,
                deps: rootDeps,
                depIndex: 0
            });
            visitingSet.add(rootId);
            visitingPath.push(rootId);

            while (stack.length > 0) {
                const currentFrame = stack[stack.length - 1];
                const currentId = currentFrame.id;

                // Process next dependency
                if (currentFrame.depIndex < currentFrame.deps.length) {
                    const depId = currentFrame.deps[currentFrame.depIndex];
                    currentFrame.depIndex++;

                    if (!hasNode(depId)) {
                        onMissingDependency(currentId, depId);
                        continue;
                    }

                    if (visited.has(depId)) {
                        continue;
                    }

                    if (visitingSet.has(depId)) {
                        // Reconstruct circular path: cycle trail A -> B -> C -> A
                        const startIndex = visitingPath.indexOf(depId);
                        const cycleTrail = visitingPath.slice(startIndex).concat(depId).join(" -> ");
                        throw new Error(`${errorMessagePrefix}${cycleTrail}`);
                    }

                    // Resolve dependencies for the child node defensively before stack push
                    const depDeps = resolveDependencies(depId);

                    // Push next dependency to the stack
                    visitingSet.add(depId);
                    visitingPath.push(depId);
                    stack.push({
                        id: depId,
                        deps: depDeps,
                        depIndex: 0
                    });
                } else {
                    // All dependencies of currentId resolved
                    stack.pop();
                    visitingSet.delete(currentId);
                    visitingPath.pop();
                    visited.add(currentId);
                    sorted.push(currentId);
                }
            }
        }

        return sorted;
    }
}
