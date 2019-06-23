/**
 * Плагин валидирует корректность импортов для ленивых модулей по следуюшим правилам:
 * Файлы из папок lazy-modules могут импортироровать только файлы из того же модуля, исключения составляют файлы - входные точки модуля.
 *
 *
 * Допустим, мы в этом файле:
 * /lazy-modules/board-ui-desktop/lazy-modules/iconfinder/activator.ts
 *
 * Импорты в этом файле должны содержать следующую подстроку:
 * /app/board/lazy-modules/board-ui-desktop/lazy-modules/iconfinder/
 * или
 * /app/commons
 *
 * Но не:
 * /lazy-modules/board-ui-desktop/lazy-modules/iconfinder/.../lazy-modules/
 *
 *
 * К другим модулям можно обращаться только асинхронно:
 * modules.moduleName.load(module => {
 *   module.doSomeThing()
 * })
 *
 */
function LazyModulesImportsPlugin(options) {
	this.userOptions = options
}

const CHECKING_EXTENSIONS = ['ts', 'js', 'html', 'less', 'css', 'svg', 'png']

LazyModulesImportsPlugin.prototype.apply = function(compiler) {
	compiler.hooks.emit.tapAsync('LazyModulesImportsPlugin', function(compilation, callback) {
		let stats = compilation.getStats().toJson()

		function checkModuleImport(module) {
			const moduleName = getModuleNameWithoutLoaders(module.name)
			if (needToCheck(moduleName)) {
				let fileBaseLastIndex = getFileBaseLastIndex(moduleName)
				let fileBase = moduleName.substring(0, fileBaseLastIndex)

				//проверяем что этот файл импортируется файлами только из своего же модуля
				module.reasons.forEach(reason => {
					let reasonModuleName = getModuleNameWithoutLoaders(reason.module)
					let hasBase = reasonModuleName.indexOf(fileBase) !== -1
					if (!hasBase) {
						let e = new Error(`You cannot import '${moduleName}' from '${reasonModuleName}'`)
						compilation.errors.push(e)
					}

					let lastPart = reasonModuleName.substring(fileBaseLastIndex)
					let notFromParentModule = lastPart.indexOf('lazy-modules') === -1
					if (!notFromParentModule) {
						let e = new Error(`You cannot import '${moduleName}' from child lazy-module '${reasonModuleName}'`)
						compilation.errors.push(e)
					}
				})
			}
		}

		function getFileBaseLastIndex(moduleName) {
			const lazyModulesPattern = 'lazy-modules/'
			const index = moduleName.lastIndexOf(lazyModulesPattern)
			return moduleName.indexOf('/', index + lazyModulesPattern.length) + 1
		}

		function needToCheck(moduleName) {
			let extension = moduleName.split('.').pop()
			let fileInLazyModuleFolder = moduleName.indexOf('lazy-modules') !== -1
			return fileInLazyModuleFolder && CHECKING_EXTENSIONS.includes(extension) && !isModuleEntryPoint(moduleName)
		}

		// Отрезаем лоадеры, превращаем строку вида:
		// '../~/html-loader?interpolate!./src/lazy-modules/welcome/modals/welcomeformobiles/welcome-for-mobiles-modal.html
		// в:
		// './src/lazy-modules/welcome/modals/welcomeformobiles/welcome-for-mobiles-modal.html
		function getModuleNameWithoutLoaders(moduleName) {
			return moduleName.split('!').pop()
		}

		function isModuleEntryPoint(moduleName) {
			let fileName = moduleName.split('/').pop()
			let hasModuleEnding = moduleName.indexOf('Module.ts') !== -1
			let firstLetterInUpperCase = isUpperCase(fileName[0])
			return firstLetterInUpperCase && hasModuleEnding
		}

		function isUpperCase(ch) {
			return ch === ch.toUpperCase()
		}

		stats.modules.forEach(module => {
			checkModuleImport(module)
		})
		callback()
	})
}

module.exports = LazyModulesImportsPlugin
