import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ВАЖНО: иначе Next может игнорировать route.ts
  pageExtensions: ["ts", "tsx", "js", "jsx"],

  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    // оставь как тебе нужно: либо src, либо корень
    // вариант 1: алиас на src
    config.resolve.alias["@"] = path.resolve(process.cwd());
    // вариант 2 (если у тебя нет src/): закомментируй строку выше и включи эту
    // config.resolve.alias["@"] = path.resolve(process.cwd());

    return config;
  },
};

export default nextConfig;
