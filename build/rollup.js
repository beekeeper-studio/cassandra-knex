import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from '@rollup/plugin-json';

export default [
  {
    input: "src/index.js",
    plugins: [
      nodeResolve(),
      commonjs(),
      json()
    ],
    output: [
      {
        file: "dist/cassandra_knex_esm.js",
        format: "esm",
        sourcemap: true,
      }
    ]
  }
]
