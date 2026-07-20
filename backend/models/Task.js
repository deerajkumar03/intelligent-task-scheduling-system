const mongoose =
  require("mongoose");

const taskSchema =
  new mongoose.Schema(

    {

      jobId: {

        type: String,

        required: true,

        unique: true
      },

      groupId: {

        type: String,

        default: null
      },

      name: {

        type: String,

        required: true
      },

      type: {

        type: String,

        enum: [

          "cpu",
          "io"
        ],

        required: true
      },

      priority: {

        type: String,

        enum: [

          "low",
          "normal",
          "high",
          "critical"
        ],

        default: "normal"
      },

      status: {

        type: String,

        enum: [

          "pending",
          "processing",
          "completed",
          "failed"
        ],

        default: "pending"
      },

      taskType: {

        type: String,

        enum: [

          "text",
          "image",
          "audio",
          "video",
          "pdf",
          "generic"
        ],

        default: "generic"
      },

      assignedWorker: {

        type: String,

        default: null
      },

      assigned: {

        type: Boolean,

        default: false
      },

      retryCount: {

        type: Number,

        default: 0
      },

      maxRetries: {

        type: Number,

        default: 3
      },

      responseTime: {

        type: Number,

        default: 0
      },

     data: {

  type:
    mongoose.Schema.Types.Mixed,

  default: {}
},

      result: {

  type:
    mongoose.Schema.Types.Mixed,

  default: null
},

      failureReason: {

        type: String,

        default: null
      },

      startedAt: {

        type: Date,

        default: null
      },

      completedAt: {

        type: Date,

        default: null
      }
    },

    {

      timestamps: true
    }
  );
taskSchema.index({
  status: 1
});

taskSchema.index({
  groupId: 1
});

taskSchema.index({
  assignedWorker: 1
});

taskSchema.index({
  taskType: 1
});
module.exports =
  mongoose.model(
    "Task",
    taskSchema
  );