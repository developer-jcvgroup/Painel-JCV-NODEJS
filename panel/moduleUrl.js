moduleURL = async (req,res,next) => {

    global.URL_GET_PARAMS = req.session.URL_GET_PARAMS = req.originalUrl

    next()
}

module.exports = moduleURL;