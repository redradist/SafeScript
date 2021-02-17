let config;

if (process.env.BABEL_ENV === 'plugin') {
    module.exports = {
        presets: [
            "@babel/preset-env"
        ]
    }
} else {
    module.exports = {
        plugins: [
            require('./dist/index.js')
        ]
    }
}
