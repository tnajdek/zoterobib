/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

export default {
    clearMocks: true,
    coverageProvider: "v8",
    maxWorkers: "50%",
    moduleDirectories: [
        "src/js",
        "modules",
        "node_modules",
    ],    
    moduleNameMapper: {
        '^web-worker:(?:..?/)+(.*)$': '<rootDir>/test/mocks/$1',
        // '^file-saver$': '<rootDir>/test/mocks/file-saver.js',
    },
    setupFiles: ['./test/utils/jest-setup.js'],
    testEnvironment: "./test/utils/env-with-fetch.js",
    testEnvironmentOptions: {
        customExportConditions: [''],
    },
    testMatch: [
        "<rootDir>/test/*.test.jsx",
        //   "**/__tests__/**/*.[jt]s?(x)",
        //   "**/?(*.)+(spec|test).[tj]s?(x)"
    ],
    transform: {
        // Same as Jest's default, but also routes `.mjs` through babel-jest so that
        // ESM-only dependencies (e.g. `rettime`, pulled in by msw) can be transpiled.
        "^.+\\.m?[jt]sx?$": "babel-jest",
    },
    transformIgnorePatterns: [
        "/node_modules/(?!until-async|balanced-match|react-dnd|dnd-core|@react-dnd|dnd-multi-backend|rdndmb-html5-to-touch|rettime|@open-draft/deferred-promise|react-intl|intl-messageformat|@formatjs)",
        "\\.pnp\\.[^\\/]+$"
    ],
};
