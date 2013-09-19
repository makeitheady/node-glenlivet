var BottleResponse = function (err, response, body) {
    this.error = err;
    this.response = response;
    this.body = body;
};

module.exports = BottleResponse;