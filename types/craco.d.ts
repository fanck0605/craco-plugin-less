declare module "@craco/craco" {
  import type { Config } from "@jest/types";
  import type { Configuration, RuleSetRule, RuleSetUseItem } from "webpack";

  export interface CracoConfig {
    [key: string]: any;
  }

  export interface CracoOptions {
    verbose?: boolean;
    config?: string;
  }

  export interface CraPaths {
    dotenv: string;
    appPath: string;
    appBuild: string;
    appPublic: string;
    appHtml: string;
    appIndexJs: string;
    appPackageJson: string;
    appSrc: string;
    appTsConfig: string;
    appJsConfig: string;
    yarnLockFile: string;
    testsSetup: string;
    proxySetup: string;
    appNodeModules: string;
    swSrc: string;
    publicUrlOrPath: string;
    ownPath: string;
    ownNodeModules: string;
    appTypeDeclarations: string;
    ownTypeDeclarations: string;
    moduleFileExtensions: string[];
  }

  export interface CracoContext {
    env: string;
    paths: CraPaths;
  }

  export interface CracoWebpackContext extends CracoContext {}

  export interface CracoJestContext extends CracoContext {
    resolve: (id: string) => string;
    rootDir: string;
  }

  export type OverrideWebpackConfigFunc = (props: {
    cracoConfig: CracoConfig;
    webpackConfig: Configuration;
    pluginOptions?: any;
    context: CracoWebpackContext;
  }) => Configuration;

  export type OverrideJestConfigFunc = (props: {
    cracoConfig: CracoConfig;
    jestConfig: Config.InitialOptions;
    pluginOptions?: any;
    context: CracoJestContext;
  }) => Config.InitialOptions;

  export function loaderByName(
    loaderName: string
  ): (rule: RuleSetRule | RuleSetUseItem) => boolean;

  export function throwUnexpectedConfigError(props: {
    message: string;
    packageName?: string;
    githubRepo?: string;
    githubIssueQuery?: string;
  }): never;

  export function createWebpackDevConfig(
    callerCracoConfig: CracoConfig,
    callerContext?: Partial<CracoContext>,
    options?: CracoOptions
  ): Configuration;

  export function createWebpackProdConfig(
    callerCracoConfig: CracoConfig,
    callerContext?: Partial<CracoContext>,
    options?: CracoOptions
  ): Configuration;
}

declare module "@craco/craco/lib/config" {
  import type { CracoConfig } from "@craco/craco";

  export function processCracoConfig(
    cracoConfig: CracoConfig,
    context: { env: string }
  ): CracoConfig;
}

declare module "@craco/craco/lib/cra" {
  import type { CracoConfig, CraPaths } from "@craco/craco";

  export function getCraPaths(cracoConfig: CracoConfig): CraPaths;
}

declare module "@craco/craco/lib/features/plugins" {
  import type {
    CracoConfig,
    CracoJestContext,
    CracoWebpackContext,
  } from "@craco/craco";
  import type { Configuration } from "webpack";
  import type { Config } from "@jest/types";

  export function applyWebpackConfigPlugins(
    cracoConfig: CracoConfig,
    webpackConfig: Configuration,
    context: CracoWebpackContext
  ): Configuration;

  export function applyJestConfigPlugins(
    cracoConfig: CracoConfig,
    jestConfig: Config.InitialOptions,
    context: CracoJestContext
  ): Config.InitialOptions;
}

declare module "@craco/craco/lib/paths" {
  export const projectRoot: string;
}
