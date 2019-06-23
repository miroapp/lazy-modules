const fs = require('fs')
const path = require('path')

/**
 *
 * Плагин проверяет, что использованый в html-шабоне компонент явно заимпортирован при объявлении компонента (в ts-файле)
 * Компоненты, которые не надо явно подключать, потому что они входят в ядро,
 * добавляйте массив COMMON_COMPONENTS.
 *
 * Компонент не надо явно импортировать, если он входит в accountEntry или applicationEntry.
 *
 */
function CheckComponentImportPlugin(options) {
	this.options = options
}

const TAG_REG_EXP = /(?<=\<)([\w|\-]+)/g
const REG_COMPONENT_RE = /(\.directive\(['"](.*)['"])/g

function kebabCaseToPascalCase(str) {
	return capitalizeFirstLetter(str.replace(/-([a-z])/g, g => g[1].toUpperCase()))
}

function camelCaseToKebabCase(str) {
	return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function capitalizeFirstLetter(string) {
	return string.charAt(0).toUpperCase() + string.slice(1)
}

CheckComponentImportPlugin.prototype.apply = function(compiler) {
	const ignoredViews = this.options.ignoredViews

	compiler.hooks.emit.tap('CheckComponentImportPlugin', (compilation) => {
		function findRegisteredComponents(source) {
			let components = []
			let res
			do {
				res = REG_COMPONENT_RE.exec(source)
				if (res) {
					components.push(camelCaseToKebabCase(res[2]))
				}
			} while (res)
			return components
		}

		function checkModuleImport(module) {
			if (isComponentsView(module)) {
				const usedTags = findAllComponentsTags(module)
				if (usedTags.length > 0) {
					const componentsPatterns = usedTags.map(tag => `${kebabCaseToPascalCase(tag)}()`)
					const issuerFullPath = path.join(__dirname, '../', module.issuerName)
					const issuerContent = fs.readFileSync(issuerFullPath, 'utf-8')
					componentsPatterns.forEach(pattern => {
						if (!issuerContent.includes(pattern) && !checkRegUsingDirective(issuerContent, pattern)) {
							compilation.errors.push(
								`Component '${pattern}' was used in view '${module.name}' but does not registered in '${
									module.issuerName
								}'. You need to register this components in '${getFileName(module.issuerName)}'.`
							)
						}
					})
				}
			}
		}

		// Так же попробуем найти регистрацию директивы по такому шаблону:
		// getRtbApp().directive('componentName', ...)
		function checkRegUsingDirective(issuerContent, pattern) {
			let componentName = camelCaseToKebabCase(pattern.substring(0, pattern.length - 2))
			let registeredComponents = findRegisteredComponents(issuerContent)
			return registeredComponents.includes(componentName)
		}

		function getFileName(filePath) {
			return filePath.split('/').pop()
		}

		function isComponentsView(module) {
			if (ignoredViews.includes(module.name)) {
				return false
			} else {
				let extension = module.name.split('.').pop()
				return extension === 'html' && module.name.startsWith('./src/')
			}
		}

		function findAllComponentsTags(module) {
			let match = module.source.match(TAG_REG_EXP)
			if (!match) {
				compilation.warnings.push(`\n\nEmpty template!: ${module.name}`)
				return []
			}
			const tags = match.filter(tag => !ignoringTags.includes(tag))
			return tags.filter((item, pos) => tags.indexOf(item) === pos) //удяляем дубликаты
		}

		let ignoringTags = [...coreComponents, ...builtInTags]
		let stats = compilation.getStats().toJson()
		stats.modules.forEach(checkModuleImport)
	})
}

module.exports = CheckComponentImportPlugin

// Тут перечислены компоненты из файла components/web/common/forms/forms.ts
const coreComponents = [
	'icon',
  'rtb-toggle',
  'rtb-checkbox',
  'rtb-radiobutton',
	'rtb-select',
  'users-list',
  'user-picture',
  'rtb-modal',
  'rtb-modal-close-button',
  'brick-input',
  'popup-container',
  'rtb-autocomplete',
  'rtb-editable-list',
  'rtb-progress-steps',
  'info-tooltip',
  'number-input',
  'material-spinner',
  'scrollable',
  'autosuggest-editor',
  'select-input',
  'select-options',
  'ui-input',
  'ui-button',
  'ui-select',
  'ui-checkbox',
  'ui-loader',
  'ui-upload',
  'ui-radio',
  'rtb-modal-old',
  'rtb-modal-header',
  'rtb-modal-editable-header'
]

const HTML_TAGS = [
	'a',
	'abbr',
	'address',
	'area',
	'article',
	'aside',
	'audio',
	'b',
	'base',
	'bdi',
	'bdo',
	'blockquote',
	'body',
	'br',
	'button',
	'canvas',
	'caption',
	'cite',
	'code',
	'col',
	'colgroup',
	'data',
	'datalist',
	'dd',
	'del',
	'details',
	'dfn',
	'dialog',
	'div',
	'dl',
	'dt',
	'em',
	'embed',
	'fieldset',
	'figcaption',
	'figure',
	'footer',
	'form',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'head',
	'header',
	'hgroup',
	'hr',
	'html',
	'i',
	'iframe',
	'img',
	'input',
	'ins',
	'kbd',
	'keygen',
	'label',
	'legend',
	'li',
	'link',
	'main',
	'map',
	'mark',
	'math',
	'menu',
	'menuitem',
	'meta',
	'meter',
	'nav',
	'noscript',
	'object',
	'ol',
	'optgroup',
	'option',
	'output',
	'p',
	'param',
	'picture',
	'pre',
	'progress',
	'q',
	'rb',
	'rp',
	'rt',
	'rtc',
	'ruby',
	's',
	'samp',
	'script',
	'section',
	'select',
	'slot',
	'small',
	'source',
	'span',
	'strong',
	'style',
	'sub',
	'summary',
	'sup',
	'svg',
	'table',
	'tbody',
	'td',
	'template',
	'textarea',
	'tfoot',
	'th',
	'thead',
	'time',
	'title',
	'tr',
	'track',
	'u',
	'ul',
	'var',
	'video',
	'wbr'
]

const SVG_TAGS = [
	'a',
	'altGlyph',
	'altGlyphDef',
	'altGlyphItem',
	'animate',
	'animateColor',
	'animateMotion',
	'animateTransform',
	'animation',
	'audio',
	'canvas',
	'circle',
	'clipPath',
	'color-profile',
	'cursor',
	'defs',
	'desc',
	'discard',
	'ellipse',
	'feBlend',
	'feColorMatrix',
	'feComponentTransfer',
	'feComposite',
	'feConvolveMatrix',
	'feDiffuseLighting',
	'feDisplacementMap',
	'feDistantLight',
	'feDropShadow',
	'feFlood',
	'feFuncA',
	'feFuncB',
	'feFuncG',
	'feFuncR',
	'feGaussianBlur',
	'feImage',
	'feMerge',
	'feMergeNode',
	'feMorphology',
	'feOffset',
	'fePointLight',
	'feSpecularLighting',
	'feSpotLight',
	'feTile',
	'feTurbulence',
	'filter',
	'font',
	'font-face',
	'font-face-format',
	'font-face-name',
	'font-face-src',
	'font-face-uri',
	'foreignObject',
	'g',
	'glyph',
	'glyphRef',
	'handler',
	'hatch',
	'hatchpath',
	'hkern',
	'iframe',
	'image',
	'line',
	'linearGradient',
	'listener',
	'marker',
	'mask',
	'mesh',
	'meshgradient',
	'meshpatch',
	'meshrow',
	'metadata',
	'missing-glyph',
	'mpath',
	'path',
	'pattern',
	'polygon',
	'polyline',
	'prefetch',
	'radialGradient',
	'rect',
	'script',
	'set',
	'solidColor',
	'solidcolor',
	'stop',
	'style',
	'svg',
	'switch',
	'symbol',
	'tbreak',
	'text',
	'textArea',
	'textPath',
	'title',
	'tref',
	'tspan',
	'unknown',
	'use',
	'video',
	'view',
	'vkern'
]

const ANGULAR_TAGS = ['ng-transclude', 'ng-pluralize']

const builtInTags = [...SVG_TAGS, ...HTML_TAGS, ...ANGULAR_TAGS]
