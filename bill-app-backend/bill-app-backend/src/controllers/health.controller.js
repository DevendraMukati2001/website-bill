const { getMongoStatus } = require("../services/mongoStatus");

const healthController = {
  health: async (req, res, next) => {
    try {
      const mongo = await getMongoStatus();

      return res.json({
        ok: true,
        service: "bill-app-backend",
        time: new Date().toISOString(),
        status: {
          mongo,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { healthController };
