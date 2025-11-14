/**
 * Mega Setup System - Comprehensive Type Definitions
 *
 * This file defines all TypeScript types for the mega-setup system,
 * which orchestrates the creation of complex multi-app monorepo projects.
 */

// ============================================================================
// PROJECT CONFIGURATION
// ============================================================================

export interface ProjectConfig {
  /** Project name (lowercase, hyphenated) */
  name: string;
  /** Short description of the project */
  description: string;
  /** Package scope (e.g., "@mycompany") */
  packageScope: string;
  /** Array of project types to generate */
  projectType: Array<'web' | 'mobile' | 'desktop' | 'api'>;
  /** Target platforms for deployment */
  targetPlatforms: string[];
  /** Feature configuration */
  features: FeatureConfig;
  /** Technology stack configuration */
  techStack: TechStackConfig;
  /** Deployment configuration */
  deployment: DeploymentConfig;
}

// ============================================================================
// FEATURE CONFIGURATION
// ============================================================================

export interface FeatureConfig {
  /** Include user authentication */
  authentication: boolean;
  /** Include database support */
  database: boolean;
  /** Include file upload capabilities */
  fileUploads: boolean;
  /** Include real-time features (WebSockets) */
  realtime: boolean;
  /** Include email sending */
  email: boolean;
  /** Include payment processing */
  payments: boolean;
  /** Include admin dashboard */
  adminDashboard: boolean;
  /** Include API documentation generation */
  apiDocs: boolean;
}

// ============================================================================
// TECH STACK CONFIGURATION
// ============================================================================

export interface TechStackConfig {
  /** Frontend configuration (null if no frontend) */
  frontend: FrontendConfig | null;
  /** Backend configuration (null if no backend) */
  backend: BackendConfig | null;
}

export interface FrontendConfig {
  /** Frontend framework choice */
  framework: 'react' | 'react-native' | 'both';
  /** UI library choice */
  uiLibrary: 'mantine' | 'tailwind' | 'react-native-paper' | 'none';
  /** State management solution */
  stateManagement: 'redux' | 'zustand' | 'context' | 'none';
  /** Include routing */
  routing: boolean;
}

export interface BackendConfig {
  /** Backend framework */
  framework: 'express' | 'fastify' | 'none';
  /** Database ORM/ODM */
  database: 'prisma' | 'mongoose' | 'none';
  /** Request validation library */
  validation: 'zod' | 'yup' | 'none';
  /** Authentication strategy */
  authentication: 'jwt' | 'oauth' | 'none';
  /** Enable CORS */
  cors: boolean;
  /** Enable logging */
  logging: boolean;
}

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================

export interface DeploymentConfig {
  /** Deployment target platform */
  target: 'vercel' | 'aws' | 'heroku' | 'self-hosted' | 'not-sure';
}

// ============================================================================
// GENERATED OUTPUT
// ============================================================================

export interface GeneratedApp {
  /** App name */
  name: string;
  /** App type */
  type: 'web' | 'mobile' | 'desktop' | 'api' | 'library';
  /** Absolute path to generated app */
  path: string;
  /** Whether generation was successful */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
}

export interface GeneratedProject {
  /** Project name */
  name: string;
  /** Root directory path */
  rootPath: string;
  /** List of generated apps */
  apps: GeneratedApp[];
  /** List of generated packages */
  packages: GeneratedApp[];
  /** Overall success status */
  success: boolean;
  /** Errors encountered during generation */
  errors: string[];
}

// ============================================================================
// VALIDATION RESULTS
// ============================================================================

export interface ValidationResult {
  /** Overall validation success */
  success: boolean;
  /** List of validation errors */
  errors: ValidationIssue[];
  /** List of validation warnings */
  warnings: ValidationWarning[];
  /** List of auto-fixed issues */
  autoFixed: string[];
  /** Human-readable summary */
  summary: string;
}

export interface ValidationIssue {
  /** Error type */
  type: 'typecheck' | 'lint' | 'format' | 'test';
  /** File path where error occurred */
  file: string;
  /** Error message */
  message: string;
  /** Line number (if applicable) */
  line?: number;
  /** Column number (if applicable) */
  column?: number;
}

export interface ValidationWarning {
  /** Warning type */
  type: string;
  /** Warning message */
  message: string;
  /** Suggested fix (if available) */
  suggestion?: string;
}

// ============================================================================
// RULE RECOMMENDATIONS
// ============================================================================

export interface RuleRecommendation {
  /** Rule name */
  ruleName: string;
  /** File path where rule should be applied */
  filePath: string;
  /** Reason for recommendation */
  reason: string;
  /** Recommendation priority */
  priority: 'high' | 'medium' | 'low';
  /** Rule category */
  category: 'frontend' | 'backend' | 'testing' | 'documentation' | 'monorepo';
  /** Recommended configuration */
  config?: Record<string, unknown>;
}

export interface RuleRecommendationResult {
  /** List of recommended rules */
  recommendations: RuleRecommendation[];
  /** Total count of recommendations */
  total: number;
  /** Recommendations by priority */
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  /** Recommendations by category */
  byCategory: Record<string, number>;
}

// ============================================================================
// GENERATOR FUNCTION TYPES
// ============================================================================

/**
 * Generator function signature - all generators follow this pattern
 */
export type GeneratorFunction<TConfig> = (config: TConfig) => Promise<void>;

/**
 * Generator with validation support
 */
export type ValidatedGeneratorFunction<TConfig> = (
  config: TConfig,
  validate?: boolean,
) => Promise<GeneratedApp>;

// ============================================================================
// ORCHESTRATION TYPES
// ============================================================================

export interface OrchestrationPlan {
  /** Project configuration */
  project: ProjectConfig;
  /** List of generators to run in sequence */
  generators: GeneratorStep[];
  /** Estimated time to complete (seconds) */
  estimatedTime: number;
}

export interface GeneratorStep {
  /** Step identifier */
  id: string;
  /** Human-readable step name */
  name: string;
  /** Generator type */
  type: 'web' | 'mobile' | 'desktop' | 'api' | 'library';
  /** Configuration for this step */
  config: unknown;
  /** Dependencies (must complete before this step) */
  dependencies: string[];
}

export interface OrchestrationResult {
  /** Orchestration plan that was executed */
  plan: OrchestrationPlan;
  /** Generated project */
  project: GeneratedProject;
  /** Total execution time (milliseconds) */
  executionTime: number;
  /** Individual step results */
  steps: StepResult[];
}

export interface StepResult {
  /** Step ID from plan */
  stepId: string;
  /** Step name */
  name: string;
  /** Success status */
  success: boolean;
  /** Execution time (milliseconds) */
  executionTime: number;
  /** Error message if failed */
  error?: string;
  /** Generated artifacts */
  artifacts: string[];
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface ProgressUpdate {
  /** Current step index */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Current step name */
  stepName: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Status message */
  message: string;
  /** Timestamp */
  timestamp: Date;
}

export type ProgressCallback = (update: ProgressUpdate) => void;

// ============================================================================
// ERROR TYPES
// ============================================================================

export class GeneratorError extends Error {
  constructor(
    message: string,
    public readonly generatorType: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'GeneratorError';
  }
}

export class SetupValidationError extends Error {
  constructor(
    message: string,
    public readonly validationType: string,
    public readonly errors: ValidationIssue[],
  ) {
    super(message);
    this.name = 'SetupValidationError';
  }
}

export class OrchestrationError extends Error {
  constructor(
    message: string,
    public readonly failedStep: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = 'OrchestrationError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Extract generator config type from generator function
 */
export type ExtractConfig<T> = T extends GeneratorFunction<infer C>
  ? C
  : never;
