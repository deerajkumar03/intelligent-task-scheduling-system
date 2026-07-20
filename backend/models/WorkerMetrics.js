const mongoose =
  require("mongoose");

const workerMetricsSchema =
  new mongoose.Schema(

    {

      workerId: {

        type: String,

        required: true,

        unique: true
      },

      workerType: {

        type: String,

        enum: [

          "cpu",
          "io"
        ],

        required: true
      },

      cpu: {

        type: Number,

        default: 0
      },

      ram: {

        type: Number,

        default: 0
      },

      activeJobs: {

        type: Number,

        default: 0
      },

      completedJobs: {

        type: Number,

        default: 0
      },

      failedJobs: {

        type: Number,

        default: 0
      },

      avgLatency: {

        type: Number,

        default: 0
      },

      lastHeartbeat: {

        type: Date,

        default: Date.now
      },

      status: {

        type: String,

        enum:[
  "healthy",
  "degraded",
  "overloaded",
  "offline",
  "recovering"
],

        default: "healthy"
      }
    },

    {

      timestamps: true
    }
  );
workerMetricsSchema.index({
  status: 1
});
module.exports =
  mongoose.model(

    "WorkerMetrics",

    workerMetricsSchema
  );