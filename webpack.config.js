/*
 * Copyright (C) 2019 Alex <alexhyisen@gmail.com>
 *
 * This file is part of reaction.
 *
 * reaction is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * reaction is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with reaction.  If not, see <https://www.gnu.org/licenses/>.
 */

const path = require("path")
const UglifyJsPlugin = require("uglifyjs-webpack-plugin")
const glob = require("glob")

module.exports = {
    entry: {
        "bundle.js": glob.sync("build/static/?(js|css)/*.?(js|css)").map(f => path.resolve(__dirname, f)),
    },
    output: {
        filename: "build/static/js/bundle.min.js",
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"],
            },
        ],
    },
    plugins: [new UglifyJsPlugin()],
}