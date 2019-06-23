const vm = require('vm')
const SizeFormatHelpers = require('webpack/lib/SizeFormatHelpers')
const MiroUtils = require('./utils.js')

const MAX_MAX_CHUNK_SIZE = 1.5 * 1024 * 1024 // in bytes
const PLUGIN_NAME = 'ChunkControlPlugin'

function ChunkControlPlugin(options) {
	this.maxEntrySize = parseSize(options.maxEntrySize)
	this.isProd = options.isProd
}

const DEFAULT_CHUNK_STATIC_OPTIONS = {
	maxSize: Infinity
}

function parseSize(input) {
	let size = (input || '').trim()

	let result
	if (size.endsWith('mb')) {
		result = parseFloat(size.slice(0, size.length - 2)) * 1024 * 1024
	} else if (size.endsWith('kb')) {
		result = parseFloat(size.slice(0, size.length - 2)) * 1024
	} else if (size.endsWith('b')) {
		result = parseInt(size.slice(0, size.length - 1), 10) * 1024
	}

	if (result === undefined || isNaN(result)) {
		throw new Error(`Invalid chunk size format: "${input}". Can be in mb - "1.57mb", in kb - "139.5kb", or in bytes - "1024b".`)
	}

	return result	
}

ChunkControlPlugin.prototype.apply = function (compiler) {
	const STATIC_CHUNKS_OPTIONS = {}
	const isProd = this.isProd
	const maxEntrySize = this.maxEntrySize

	MiroUtils.subsribeToImportOptions(PLUGIN_NAME, compiler, importOptions => {
		const chunkStaticOptions = {...DEFAULT_CHUNK_STATIC_OPTIONS}

		if (importOptions.webpackChunkMaxSize) {
			chunkStaticOptions.maxSize = parseSize(importOptions.webpackChunkMaxSize)
		}

		STATIC_CHUNKS_OPTIONS[importOptions.webpackChunkName] = chunkStaticOptions
	})

	compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, (compilation, callback) => {
		let entryId

		let {topChunks, initials, entries} = MiroUtils.collectChunksInfo(compilation)
		if (entries.length > 1) {
			compilation.errors.push(`[${PLUGIN_NAME}] Too many entries. Only one is permitted for build. Entries: ${entries}`)
		} else if (initials.length > 1) {
			compilation.errors.push(`[${PLUGIN_NAME}] To many initial scripts. Only one is permitted - the entry itself. You have ${initials.length}: ${initials}`)
		} else if (isProd) {
			// we collect static options from import() magic comments,
			// no one imports entry file, so we need to define its options manually
			STATIC_CHUNKS_OPTIONS[entries[0].name] = {
				...DEFAULT_CHUNK_STATIC_OPTIONS,
				maxSize: maxEntrySize
			}

			topChunks.forEach(topChunk => {
				let chunkOptions = STATIC_CHUNKS_OPTIONS[topChunk.name]
				let currentSize = SizeFormatHelpers.formatSize(topChunk.sizeWithChildren)

				if (topChunk.sizeWithChildren > chunkOptions.maxSize) {
					let maxSize = SizeFormatHelpers.formatSize(chunkOptions.maxSize)
					compilation.errors.push(`[${PLUGIN_NAME}] Chunk "${topChunk.name}" exceeded the limits. Size: ${currentSize}, max size: ${maxSize}`)
				}

				if (topChunk.name !== 'Board' && topChunk.sizeWithChildren > MAX_MAX_CHUNK_SIZE) {
					let maxSize = SizeFormatHelpers.formatSize(MAX_MAX_CHUNK_SIZE)
					compilation.errors.push(`[${PLUGIN_NAME}] Chunk "${topChunk.name}" is too big: ${currentSize}, max size: ${maxSize}. Check that chunk, seems like it now has some unexpected dependencies.`)
				}
			})
		}

		callback()
	})
}

module.exports = ChunkControlPlugin
