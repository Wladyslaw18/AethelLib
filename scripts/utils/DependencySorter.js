/**
 * Reusable utility for performing dependency-resolution topological sorting.
 * Prevents circular reference lockups and ensures correct execution order.
 */
export class DependencySorter {
    /**
     * Topologically sorts nodes in a dependency graph.
     * @param {string[]} nodes The array of node IDs to sort.
     * @param {Object} options Config options.
     * @param {function(string): string[]} options.getDependencies Callback to retrieve dependencies for an ID.
     * @param {function(string): boolean} options.hasNode Callback to check if a node ID exists in the graph.
     * @param {function(string, string): void} [options.onMissingDependency] Callback when a dependency is missing.
     * @param {string} [options.errorMessagePrefix] Prefix for the circular dependency error message.
     * @returns {string[]} The topologically sorted list of node IDs.
     */
    static sort(nodes, options) {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        
        const getDependencies = options.getDependencies;
        const hasNode = options.hasNode;
        const onMissingDependency = options.onMissingDependency || (() => {});
        const errorMessagePrefix = options.errorMessagePrefix || "Circular dependency detected: ";

        const visit = (id) => {
            if (!hasNode(id)) {
                return;
            }
            if (visiting.has(id)) {
                throw new Error(`${errorMessagePrefix}${id}`);
            }
            if (visited.has(id)) {
                return;
            }

            visiting.add(id);
            const deps = getDependencies(id);
            if (deps) {
                for (const dep of deps) {
                    if (!hasNode(dep)) {
                        onMissingDependency(id, dep);
                        continue;
                    }
                    visit(dep);
                }
            }
            visiting.delete(id);
            visited.add(id);
            sorted.push(id);
        };

        for (const id of nodes) {
            if (!visited.has(id)) {
                visit(id);
            }
        }

        return sorted;
    }
}
