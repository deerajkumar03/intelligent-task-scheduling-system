module.exports = {
  apps: [
    {
      name: "cpu-worker",
      script: "workers/worker.js",
      instances: 2,
      exec_mode: "fork",

      env: {
  WORKER_TYPE: "cpu"
}
    },

    {
      name: "io-worker",
      script: "workers/worker.js",
      instances: 2,
      exec_mode: "fork",

      env: {
  WORKER_TYPE: "io"
}
    }
  ]
};