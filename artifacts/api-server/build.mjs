import { createRequire } from "node:module";
import { statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { readFile, rm } from "node:fs/promises";

// Plugins (e.g. 'esbuild-plugin-pino') may use `require` to resolve dependencies
globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(artifactDir, "..", "..");
const resolvableExtensions = [".ts", ".tsx", ".js", ".mjs", ".json"];

function isFile(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function resolveLocalFile(importPath) {
  if (isFile(importPath)) return importPath;

  for (const extension of resolvableExtensions) {
    const candidate = `${importPath}${extension}`;
    if (isFile(candidate)) return candidate;
  }

  for (const extension of resolvableExtensions) {
    const candidate = path.join(importPath, `index${extension}`);
    if (isFile(candidate)) return candidate;
  }

  return undefined;
}

const workspacePackages = new Map([
  ["@workspace/api-zod", path.join(workspaceDir, "lib", "api-zod", "src", "index.ts")],
  ["@workspace/db", path.join(workspaceDir, "lib", "db", "src", "index.ts")],
  ["@workspace/db/schema", path.join(workspaceDir, "lib", "db", "src", "schema", "index.ts")],
  [
    "@workspace/integrations-gemini-ai",
    path.join(workspaceDir, "lib", "integrations-gemini-ai", "src", "index.ts"),
  ],
  [
    "@workspace/integrations-gemini-ai/batch",
    path.join(workspaceDir, "lib", "integrations-gemini-ai", "src", "batch", "index.ts"),
  ],
  [
    "@workspace/integrations-gemini-ai/image",
    path.join(workspaceDir, "lib", "integrations-gemini-ai", "src", "image", "index.ts"),
  ],
]);

const localSourcePlugin = {
  name: "local-source",
  setup(build) {
    build.onResolve({ filter: /^\.{1,2}\// }, (args) => {
      const resolved = resolveLocalFile(path.resolve(args.resolveDir, args.path));
      if (!resolved) return undefined;
      return { path: resolved, namespace: "local-source" };
    });

    build.onResolve({ filter: /^@workspace\// }, (args) => {
      const resolved = workspacePackages.get(args.path);
      if (!resolved) return undefined;
      return { path: resolved, namespace: "local-source" };
    });

    build.onResolve({ filter: /.*/ }, (args) => ({
      path: args.path,
      external: true,
    }));

    build.onLoad({ filter: /.*/, namespace: "local-source" }, async (args) => ({
      contents: await readFile(args.path, "utf8"),
      loader: args.path.endsWith(".json") ? "json" : "ts",
      resolveDir: path.dirname(args.path),
    }));
  },
};

async function buildAll() {
  const distDir = path.resolve(artifactDir, "dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    stdin: {
      contents: await readFile(path.join(artifactDir, "src", "index.ts"), "utf8"),
      loader: "ts",
      resolveDir: path.join(artifactDir, "src"),
      sourcefile: "src/index.ts",
    },
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: path.join(distDir, "index.mjs"),
    logLevel: "info",
    // Some packages may not be bundleable, so we externalize them, we can add more here as needed.
    // Some of the packages below may not be imported or installed, but we're adding them in case they are in the future.
    // Examples of unbundleable packages:
    // - uses native modules and loads them dynamically (e.g. sharp)
    // - use path traversal to read files (e.g. @google-cloud/secret-manager loads sibling .proto files)
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "pino",
      "pino-http",
      "pino-pretty",
      "thread-stream",
      "re2",
      "farmhash",
      "xxhash-addon",
      "bufferutil",
      "utf-8-validate",
      "ssh2",
      "cpu-features",
      "dtrace-provider",
      "isolated-vm",
      "lightningcss",
      "pg-native",
      "oracledb",
      "mongodb-client-encryption",
      "nodemailer",
      "handlebars",
      "knex",
      "typeorm",
      "protobufjs",
      "onnxruntime-node",
      "@tensorflow/*",
      "@prisma/client",
      "@mikro-orm/*",
      "@grpc/*",
      "@swc/*",
      "@aws-sdk/*",
      "@azure/*",
      "@opentelemetry/*",
      "@google-cloud/*",
      "@google/*",
      "googleapis",
      "firebase-admin",
      "@parcel/watcher",
      "@sentry/profiling-node",
      "@tree-sitter/*",
      "aws-sdk",
      "classic-level",
      "dd-trace",
      "ffi-napi",
      "grpc",
      "hiredis",
      "kerberos",
      "leveldown",
      "miniflare",
      "mysql2",
      "newrelic",
      "odbc",
      "piscina",
      "realm",
      "ref-napi",
      "rocksdb",
      "sass-embedded",
      "sequelize",
      "serialport",
      "snappy",
      "tinypool",
      "usb",
      "workerd",
      "wrangler",
      "zeromq",
      "zeromq-prebuilt",
      "playwright",
      "puppeteer",
      "puppeteer-core",
      "electron",
    ],
    sourcemap: "linked",
    plugins: [localSourcePlugin],
    // Make sure packages that are cjs only (e.g. express) but are bundled continue to work in our esm output file
    banner: {
      js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';

globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
    `,
    },
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
