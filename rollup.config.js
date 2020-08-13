import serve from 'rollup-plugin-serve';

//  rollup可以打包es6 模块化语法， 不用Babel？
export default {
    input: './src/single-spa.js',
    output: {
        file: './lib/umd/single-spa.js',
        format: 'umd', // 用UMD可以把整个打包的结果挂载到window上
        name: 'singleSpa',
        sourceMap: true,
    },
    plugins: [
        serve({
            openPage: '/index.html',
            contentBase: '',
            port: 3000
        })
    ]
}