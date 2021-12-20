import { createJestConfig } from "@craco/craco";
import { processCracoConfig } from "@craco/craco/lib/config";
import { applyJestConfigPlugins } from "@craco/craco/lib/features/plugins";
import * as lessPlugin from "../src/less-plugin";
import { getCracoContext } from "./test-utils";
import { cloneDeep } from "lodash";

process.env.NODE_ENV = "test";

const contexts = ["react-scripts-v4", "react-scripts-v5"].map(
  (reactScriptsVersion) => {
    const baseCracoConfig = { reactScriptsVersion };
    const cracoContext = getCracoContext(baseCracoConfig);
    const originalJestConfig = createJestConfig(baseCracoConfig);

    const overrideJestConfig = (callerCracoConfig, jestConfig) => {
      return applyJestConfigPlugins(
        processCracoConfig({
          ...baseCracoConfig,
          ...callerCracoConfig,
        }),
        jestConfig,
        cracoContext
      );
    };

    return {
      baseCracoConfig,
      cracoContext,
      jestConfig: originalJestConfig,
      originalJestConfig,
      overrideJestConfig,
    };
  }
);

beforeEach(() => {
  // deep clone the object before each test.
  contexts.forEach((context) => {
    context.jestConfig = cloneDeep(context.originalJestConfig);
  });
});

test("the jest config is modified correctly", () => {
  contexts.forEach(({ jestConfig, overrideJestConfig }) => {
    jestConfig = overrideJestConfig(
      {
        plugins: [{ plugin: lessPlugin }],
      },
      jestConfig
    );

    const moduleNameMapper = jestConfig.moduleNameMapper;
    expect(moduleNameMapper["^.+\\.module\\.(css|sass|scss)$"]).toBeUndefined();
    expect(moduleNameMapper["^.+\\.module\\.(css|less|sass|scss)$"]).toEqual(
      "identity-obj-proxy"
    );

    const transformIgnorePatterns = jestConfig.transformIgnorePatterns;
    expect(transformIgnorePatterns[1]).toEqual(
      "^.+\\.module\\.(css|less|sass|scss)$"
    );
  });
});

test("throws an error when we can't find CSS Modules pattern under moduleNameMapper in the jest config", () => {
  contexts.forEach(({ jestConfig, overrideJestConfig }) => {
    delete jestConfig.moduleNameMapper["^.+\\.module\\.(css|sass|scss)$"];

    const runTest = () => {
      overrideJestConfig(
        {
          plugins: [{ plugin: lessPlugin }],
        },
        jestConfig
      );
    };

    expect(runTest).toThrowError(
      /^Can't find CSS Modules pattern under moduleNameMapper in the test jest config!/
    );
  });
});

test("throws an error when we can't find CSS Modules pattern under transformIgnorePatterns in the jest config", () => {
  contexts.forEach(({ jestConfig, overrideJestConfig }) => {
    jestConfig.transformIgnorePatterns =
      jestConfig.transformIgnorePatterns.filter(
        (e) => e !== "^.+\\.module\\.(css|sass|scss)$"
      );

    const runTest = () => {
      overrideJestConfig(
        {
          plugins: [{ plugin: lessPlugin }],
        },
        jestConfig
      );
    };

    expect(runTest).toThrowError(
      /^Can't find CSS Modules pattern under transformIgnorePatterns in the test jest config!/
    );
  });
});
