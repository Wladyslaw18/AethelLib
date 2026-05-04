# Architecture Documentation - Aethelgrad Essentials (BP)

## Project Overview
This document provides a comprehensive overview of all files and their organization within the Aethelgrad Essentials Minecraft Bedrock Edition behavior pack.

## File Structure

### Root Level Files
- **`.eslintrc.json`** - ESLint configuration for JavaScript linting rules
- **`jsconfig.json`** - JavaScript project configuration for IDE support
- **`manifest.json`** - Minecraft behavior pack manifest with metadata and dependencies
- **`package.json`** - Node.js package configuration with dependencies and scripts
- **`TYPESCRIPT_SETUP.md`** - Documentation for TypeScript development setup

### Configuration Directory
- **`.vscode/`** - Visual Studio Code configuration directory
  - Contains IDE-specific settings and extensions

### Entities Directory (`entities/`)
- **`kit_npc.json`** - NPC entity definition for kit system functionality
- **`tp_npc.json`** - NPC entity definition for teleportation system functionality

### Scripts Directory (`scripts/`)

#### Bootstrap Scripts (`scripts/bootstrap/`)
- **`commands.js`** - Command system initialization and registration
- **`services.js`** - Core services initialization and setup
- **`systems.js`** - System modules initialization and coordination

#### Commands Directory (`scripts/commands/`)
- **`base/BaseCommand.js`** - Base command class with common functionality
- **`general/calculate.js`** - Mathematical calculation command implementation

#### Core Directory (`scripts/core/`)
- **`abstractions/`** - Interface definitions and abstract classes
  - **`ICommand.js`** - Command interface definition
  - **`IStore.js`** - Data store interface definition
  - **`ISystem.js`** - System interface definition
- **`datastore/`** - Data storage implementations
  - **`PlayerStore.js`** - Player-specific data management
  - **`WorldStore.js`** - World-level data management
- **`permissions/`** - Permission system
  - **`PermissionManager.js`** - Access control and permission management
- **`signalbus/`** - Event communication system
  - **`SignalBus.js`** - Centralized event bus for system communication

#### Type Definitions (`scripts/`)
- **`types.d.ts`** - TypeScript type definitions
- **`types.js`** - JavaScript type declarations and constants

#### Utilities (`scripts/utils/`)
- **`FormatHelper.js`** - Text formatting and display utilities
- **`TimeHelper.js`** - Time and date manipulation utilities

## Architecture Patterns

### Modular Design
The project follows a modular architecture with clear separation of concerns:
- **Bootstrap**: System initialization and startup coordination
- **Commands**: User-facing command implementations
- **Core**: Essential system components and abstractions
- **Utils**: Shared utility functions

### Interface-Based Architecture
The `abstractions/` directory defines interfaces that promote:
- Loose coupling between components
- Testability through dependency injection
- Consistent API contracts across the codebase

### Event-Driven Communication
The SignalBus system implements a publish-subscribe pattern for:
- Decoupled component communication
- Centralized event management
- Scalable system interactions

### Data Management
Separate stores for different data scopes:
- **PlayerStore**: Individual player data and preferences
- **WorldStore**: Global world state and configuration

## Key Features
- **Command System**: Extensible command framework with base classes
- **Permission Management**: Role-based access control
- **NPC Integration**: Custom entities for kit and teleportation features
- **TypeScript Support**: Full TypeScript development environment
- **Modular Architecture**: Clean separation of concerns for maintainability

## Development Notes
- Uses ESLint for code quality enforcement
- Supports both JavaScript and TypeScript development
- Follows modular design principles for scalability
- Implements comprehensive error handling through the core systems

