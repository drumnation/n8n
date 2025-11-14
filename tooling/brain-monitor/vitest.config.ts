import { defineConfig } from "vitest/config";
import { configs } from "@kit/testing";

export default defineConfig(await configs.vitest.unit());
