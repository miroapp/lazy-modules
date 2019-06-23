# Lazy modules by Miro

Lazy module is a logical block, that should be loaded separately on demand from the core app. Module includes all TS/JS/HTML/CSS files for that logical part (UI and code). 

##Components import checking

**Plugin:** 
`CheckComponentImportPlugin.js`

**Usage:**

```

var checkComponentImportPlugin = new CheckComponentImportPlugin({
	ignoredViews: [
		'./src/components/web/common/sidebars/left-sidebar.html',
		// views you dont want to check
	]
})


webpackConfig.plugins.push(lazyModulesImportsPlugin)
```

##Module size checking

**Plugin:** 
`ChunkControlPlugin.js`

**Usage:**
```
config.plugins.push(new ChunkControlPlugin({
    isProd: true,
    maxEntrySize: "59kb"
   }))
```

##Import between modules checking

**Plugin:** 
`LazyModulesImportsPlugin.js`

**Usage:**
```
config.plugins.push(new LazyModulesImportsPlugin())
```


