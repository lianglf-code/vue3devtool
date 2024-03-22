"use strict";
(self["webpackChunk_vue_devtools_shell_chrome"] = self["webpackChunk_vue_devtools_shell_chrome"] || []).push([["CodeEditor"],{

/***/ "../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/lib/index.js??vue-loader-options!../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js&":
/*!*********************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/lib/index.js??vue-loader-options!../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js& ***!
  \*********************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var monaco_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! monaco-editor */ "include-loader!../../node_modules/monaco-editor/esm/vs/editor/editor.main.js");
/* harmony import */ var lodash_merge__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash/merge */ "../../node_modules/lodash/merge.js");
/* harmony import */ var lodash_merge__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash_merge__WEBPACK_IMPORTED_MODULE_1__);
// Fork of https://github.com/egoist/vue-monaco/

 // eslint-disable-next-line @typescript-eslint/no-var-requires

monaco_editor__WEBPACK_IMPORTED_MODULE_0__.editor.defineTheme('github-light', __webpack_require__(/*! @front/assets/github-theme/light.json */ "../app-frontend/src/assets/github-theme/light.json")); // eslint-disable-next-line @typescript-eslint/no-var-requires

monaco_editor__WEBPACK_IMPORTED_MODULE_0__.editor.defineTheme('github-dark', __webpack_require__(/*! @front/assets/github-theme/dark.json */ "../app-frontend/src/assets/github-theme/dark.json"));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  name: 'MonacoEditor',
  model: {
    event: 'change'
  },
  props: {
    original: {
      type: String,
      default: null
    },
    value: {
      type: String,
      required: true
    },
    theme: {
      type: String,
      default: 'vs'
    },
    language: {
      type: String,
      default: null
    },
    options: {
      type: Object,
      default: null
    },
    diffEditor: {
      type: Boolean,
      default: false
    }
  },
  watch: {
    options: {
      deep: true,

      handler(options) {
        if (this.editor) {
          const editor = this.getModifiedEditor();
          editor.updateOptions(options);
        }
      }

    },

    value(newValue) {
      if (this.editor) {
        const editor = this.getModifiedEditor();

        if (newValue !== editor.getValue()) {
          editor.setValue(newValue);
        }
      }
    },

    original(newValue) {
      if (this.editor && this.diffEditor) {
        const editor = this.getOriginalEditor();

        if (newValue !== editor.getValue()) {
          editor.setValue(newValue);
        }
      }
    },

    language(newVal) {
      if (this.editor) {
        const editor = this.getModifiedEditor();
        this.monaco.editor.setModelLanguage(editor.getModel(), newVal);
      }
    },

    theme(newVal) {
      if (this.editor) {
        this.monaco.editor.setTheme(newVal);
      }
    }

  },

  mounted() {
    this.monaco = monaco_editor__WEBPACK_IMPORTED_MODULE_0__;
    this.$nextTick(() => {
      this.initMonaco(monaco_editor__WEBPACK_IMPORTED_MODULE_0__);
    });
  },

  beforeDestroy() {
    this.editor && this.editor.dispose();
  },

  methods: {
    initMonaco(monaco) {
      this.$emit('editorWillMount', this.monaco);
      const options = lodash_merge__WEBPACK_IMPORTED_MODULE_1___default()({
        value: this.value,
        theme: this.theme,
        language: this.language
      }, this.options);

      if (this.diffEditor) {
        this.editor = monaco.editor.createDiffEditor(this.$el, options);
        const originalModel = monaco.editor.createModel(this.original, this.language);
        const modifiedModel = monaco.editor.createModel(this.value, this.language);
        this.editor.setModel({
          original: originalModel,
          modified: modifiedModel
        });
      } else {
        this.editor = monaco.editor.create(this.$el, options);
      } // @event `change`


      const editor = this.getModifiedEditor();
      editor.onDidChangeModelContent(event => {
        const value = editor.getValue();

        if (this.value !== value) {
          this.$emit('change', value, event);
        }
      });
      this.$emit('editorDidMount', this.editor);
    },

    /** @deprecated */
    getMonaco() {
      return this.editor;
    },

    getEditor() {
      return this.editor;
    },

    getModifiedEditor() {
      return this.diffEditor ? this.editor.getModifiedEditor() : this.editor;
    },

    getOriginalEditor() {
      return this.diffEditor ? this.editor.getOriginalEditor() : this.editor;
    },

    focus() {
      this.editor.focus();
    }

  }
});

/***/ }),

/***/ "../app-frontend/src/features/code/CodeEditor.vue":
/*!********************************************************!*\
  !*** ../app-frontend/src/features/code/CodeEditor.vue ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _CodeEditor_vue_vue_type_template_id_6fe6f6c8___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CodeEditor.vue?vue&type=template&id=6fe6f6c8& */ "../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8&");
/* harmony import */ var _CodeEditor_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./CodeEditor.vue?vue&type=script&lang=js& */ "../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js&");
/* harmony import */ var _node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../../../../node_modules/vue-loader/lib/runtime/componentNormalizer.js */ "../../node_modules/vue-loader/lib/runtime/componentNormalizer.js");





/* normalize component */
;
var component = (0,_node_modules_vue_loader_lib_runtime_componentNormalizer_js__WEBPACK_IMPORTED_MODULE_2__["default"])(
  _CodeEditor_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_1__["default"],
  _CodeEditor_vue_vue_type_template_id_6fe6f6c8___WEBPACK_IMPORTED_MODULE_0__.render,
  _CodeEditor_vue_vue_type_template_id_6fe6f6c8___WEBPACK_IMPORTED_MODULE_0__.staticRenderFns,
  false,
  null,
  null,
  null
  
)

/* hot reload */
if (false) { var api; }
component.options.__file = "app-frontend/src/features/code/CodeEditor.vue"
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (component.exports);

/***/ }),

/***/ "../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js&":
/*!*********************************************************************************!*\
  !*** ../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js& ***!
  \*********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_node_modules_vue_loader_lib_index_js_vue_loader_options_CodeEditor_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./CodeEditor.vue?vue&type=script&lang=js& */ "../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/lib/index.js??vue-loader-options!../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js&");
 /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_babel_loader_lib_index_js_node_modules_vue_loader_lib_index_js_vue_loader_options_CodeEditor_vue_vue_type_script_lang_js___WEBPACK_IMPORTED_MODULE_0__["default"]); 

/***/ }),

/***/ "../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8&":
/*!***************************************************************************************!*\
  !*** ../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8& ***!
  \***************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_CodeEditor_vue_vue_type_template_id_6fe6f6c8___WEBPACK_IMPORTED_MODULE_0__.render),
/* harmony export */   "staticRenderFns": () => (/* reexport safe */ _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_CodeEditor_vue_vue_type_template_id_6fe6f6c8___WEBPACK_IMPORTED_MODULE_0__.staticRenderFns)
/* harmony export */ });
/* harmony import */ var _node_modules_vue_loader_lib_loaders_templateLoader_js_vue_loader_options_node_modules_vue_loader_lib_index_js_vue_loader_options_CodeEditor_vue_vue_type_template_id_6fe6f6c8___WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../../../../node_modules/vue-loader/lib/index.js??vue-loader-options!./CodeEditor.vue?vue&type=template&id=6fe6f6c8& */ "../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../node_modules/vue-loader/lib/index.js??vue-loader-options!../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8&");


/***/ }),

/***/ "../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../node_modules/vue-loader/lib/index.js??vue-loader-options!../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8&":
/*!**************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/vue-loader/lib/loaders/templateLoader.js??vue-loader-options!../../node_modules/vue-loader/lib/index.js??vue-loader-options!../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8& ***!
  \**************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "render": () => (/* binding */ render),
/* harmony export */   "staticRenderFns": () => (/* binding */ staticRenderFns)
/* harmony export */ });
var render = function () {
  var _vm = this
  var _h = _vm.$createElement
  var _c = _vm._self._c || _h
  return _c("div")
}
var staticRenderFns = []
render._withStripped = true



/***/ }),

/***/ "../app-frontend/src/assets/github-theme/dark.json":
/*!*********************************************************!*\
  !*** ../app-frontend/src/assets/github-theme/dark.json ***!
  \*********************************************************/
/***/ ((module) => {

module.exports = JSON.parse('{"inherit":true,"base":"vs-dark","colors":{"focusBorder":"#388bfd","foreground":"#c9d1d9","descriptionForeground":"#8b949e","errorForeground":"#f85149","textLink.foreground":"#58a6ff","textLink.activeForeground":"#58a6ff","textBlockQuote.background":"#090c10","textBlockQuote.border":"#3b434b","textCodeBlock.background":"#f0f6fc26","textPreformat.foreground":"#8b949e","textSeparator.foreground":"#21262d","button.background":"#238636","button.foreground":"#ffffff","button.hoverBackground":"#2ea043","button.secondaryBackground":"#292e34","button.secondaryForeground":"#c9d1d9","button.secondaryHoverBackground":"#30363d","checkbox.background":"#161b22","checkbox.border":"#30363d","dropdown.background":"#1c2128","dropdown.border":"#30363d","dropdown.foreground":"#c9d1d9","dropdown.listBackground":"#1c2128","input.background":"#0d1117","input.border":"#21262d","input.foreground":"#c9d1d9","input.placeholderForeground":"#484f58","badge.foreground":"#79c0ff","badge.background":"#0d419d","progressBar.background":"#1f6feb","titleBar.activeForeground":"#8b949e","titleBar.activeBackground":"#0d1117","titleBar.inactiveForeground":"#8b949e","titleBar.inactiveBackground":"#090c10","titleBar.border":"#30363d","activityBar.foreground":"#c9d1d9","activityBar.inactiveForeground":"#8b949e","activityBar.background":"#0d1117","activityBarBadge.foreground":"#f0f6fc","activityBarBadge.background":"#1f6feb","activityBar.activeBorder":"#f78166","activityBar.border":"#30363d","sideBar.foreground":"#c9d1d9","sideBar.background":"#090c10","sideBar.border":"#30363d","sideBarTitle.foreground":"#c9d1d9","sideBarSectionHeader.foreground":"#c9d1d9","sideBarSectionHeader.background":"#090c10","sideBarSectionHeader.border":"#30363d","list.hoverForeground":"#c9d1d9","list.inactiveSelectionForeground":"#c9d1d9","list.activeSelectionForeground":"#c9d1d9","list.hoverBackground":"#161b22","list.inactiveSelectionBackground":"#161b22","list.activeSelectionBackground":"#21262d","list.focusForeground":"#f0f6fc","list.focusBackground":"#21262d","list.inactiveFocusBackground":"#161b22","list.highlightForeground":"#388bfd","tree.indentGuidesStroke":"#21262d","notificationCenterHeader.foreground":"#6e7681","notificationCenterHeader.background":"#0d1117","notifications.foreground":"#8b949e","notifications.background":"#161b22","notifications.border":"#30363d","notificationsErrorIcon.foreground":"#f85149","notificationsWarningIcon.foreground":"#f0883e","notificationsInfoIcon.foreground":"#58a6ff","pickerGroup.border":"#21262d","pickerGroup.foreground":"#8b949e","quickInput.background":"#0d1117","quickInput.foreground":"#c9d1d9","statusBar.foreground":"#8b949e","statusBar.background":"#0d1117","statusBar.border":"#30363d","statusBar.noFolderBackground":"#0d1117","statusBar.debuggingBackground":"#da3633","statusBar.debuggingForeground":"#f0f6fc","statusBarItem.prominentBackground":"#161b22","editorGroupHeader.tabsBackground":"#090c10","editorGroupHeader.tabsBorder":"#30363d","editorGroup.border":"#30363d","tab.activeForeground":"#c9d1d9","tab.inactiveForeground":"#8b949e","tab.inactiveBackground":"#090c10","tab.activeBackground":"#0d1117","tab.hoverBackground":"#0d1117","tab.unfocusedHoverBackground":"#161b22","tab.border":"#30363d","tab.unfocusedActiveBorderTop":"#30363d","tab.activeBorder":"#0d1117","tab.unfocusedActiveBorder":"#0d1117","tab.activeBorderTop":"#f78166","breadcrumb.foreground":"#8b949e","breadcrumb.focusForeground":"#c9d1d9","breadcrumb.activeSelectionForeground":"#8b949e","breadcrumbPicker.background":"#1c2128","editor.foreground":"#c9d1d9","editor.background":"#0d1117","editorWidget.background":"#1c2128","editor.foldBackground":"#6e76811a","editor.lineHighlightBackground":"#161b22","editorLineNumber.foreground":"#8b949e","editorLineNumber.activeForeground":"#c9d1d9","editorIndentGuide.background":"#21262d","editorIndentGuide.activeBackground":"#30363d","editorWhitespace.foreground":"#484f58","editorCursor.foreground":"#79c0ff","editor.findMatchBackground":"#ffd33d44","editor.findMatchHighlightBackground":"#ffd33d22","editor.linkedEditingBackground":"#3392FF22","editor.inactiveSelectionBackground":"#3392FF22","editor.selectionBackground":"#3392FF44","editor.selectionHighlightBackground":"#17E5E633","editor.selectionHighlightBorder":"#17E5E600","editor.wordHighlightBackground":"#17E5E600","editor.wordHighlightStrongBackground":"#17E5E600","editor.wordHighlightBorder":"#17E5E699","editor.wordHighlightStrongBorder":"#17E5E666","editorBracketMatch.background":"#17E5E650","editorBracketMatch.border":"#17E5E600","editorGutter.modifiedBackground":"#9e6a03","editorGutter.addedBackground":"#196c2e","editorGutter.deletedBackground":"#b62324","diffEditor.insertedTextBackground":"#2ea04333","diffEditor.removedTextBackground":"#da363333","scrollbar.shadow":"#0008","scrollbarSlider.background":"#484F5833","scrollbarSlider.hoverBackground":"#484F5844","scrollbarSlider.activeBackground":"#484F5888","editorOverviewRuler.border":"#010409","panel.background":"#090c10","panel.border":"#30363d","panelTitle.activeBorder":"#f78166","panelTitle.activeForeground":"#c9d1d9","panelTitle.inactiveForeground":"#8b949e","panelInput.border":"#30363d","terminal.foreground":"#8b949e","terminal.ansiBlack":"#484f58","terminal.ansiRed":"#ff7b72","terminal.ansiGreen":"#3fb950","terminal.ansiYellow":"#d29922","terminal.ansiBlue":"#58a6ff","terminal.ansiMagenta":"#bc8cff","terminal.ansiCyan":"#39c5cf","terminal.ansiWhite":"#b1bac4","terminal.ansiBrightBlack":"#6e7681","terminal.ansiBrightRed":"#ffa198","terminal.ansiBrightGreen":"#56d364","terminal.ansiBrightYellow":"#e3b341","terminal.ansiBrightBlue":"#79c0ff","terminal.ansiBrightMagenta":"#d2a8ff","terminal.ansiBrightCyan":"#56d4dd","terminal.ansiBrightWhite":"#f0f6fc","gitDecoration.addedResourceForeground":"#56d364","gitDecoration.modifiedResourceForeground":"#e3b341","gitDecoration.deletedResourceForeground":"#f85149","gitDecoration.untrackedResourceForeground":"#56d364","gitDecoration.ignoredResourceForeground":"#484f58","gitDecoration.conflictingResourceForeground":"#e3b341","gitDecoration.submoduleResourceForeground":"#8b949e","debugToolBar.background":"#1c2128","editor.stackFrameHighlightBackground":"#D2992225","editor.focusedStackFrameHighlightBackground":"#3FB95025","peekViewEditor.matchHighlightBackground":"#ffd33d33","peekViewResult.matchHighlightBackground":"#ffd33d33","peekViewEditor.background":"#0d111788","peekViewResult.background":"#0d1117","settings.headerForeground":"#8b949e","settings.modifiedItemIndicator":"#9e6a03","welcomePage.buttonBackground":"#21262d","welcomePage.buttonHoverBackground":"#30363d"},"rules":[{"foreground":"#8b949e","token":"comment"},{"foreground":"#8b949e","token":"punctuation.definition.comment"},{"foreground":"#8b949e","token":"string.comment"},{"foreground":"#79c0ff","token":"constant"},{"foreground":"#79c0ff","token":"entity.name.constant"},{"foreground":"#79c0ff","token":"variable.other.constant"},{"foreground":"#79c0ff","token":"variable.language"},{"foreground":"#79c0ff","token":"entity"},{"foreground":"#ffa657","token":"entity.name"},{"foreground":"#ffa657","token":"meta.export.default"},{"foreground":"#ffa657","token":"meta.definition.variable"},{"foreground":"#c9d1d9","token":"variable.parameter.function"},{"foreground":"#c9d1d9","token":"meta.jsx.children"},{"foreground":"#c9d1d9","token":"meta.block"},{"foreground":"#c9d1d9","token":"meta.tag.attributes"},{"foreground":"#c9d1d9","token":"entity.name.constant"},{"foreground":"#c9d1d9","token":"meta.object.member"},{"foreground":"#c9d1d9","token":"meta.embedded.expression"},{"foreground":"#d2a8ff","token":"entity.name.function"},{"foreground":"#7ee787","token":"entity.name.tag"},{"foreground":"#7ee787","token":"support.class.component"},{"foreground":"#ff7b72","token":"keyword"},{"foreground":"#ff7b72","token":"storage"},{"foreground":"#ff7b72","token":"storage.type"},{"foreground":"#c9d1d9","token":"storage.modifier.package"},{"foreground":"#c9d1d9","token":"storage.modifier.import"},{"foreground":"#c9d1d9","token":"storage.type.java"},{"foreground":"#a5d6ff","token":"string"},{"foreground":"#a5d6ff","token":"punctuation.definition.string"},{"foreground":"#a5d6ff","token":"string punctuation.section.embedded source"},{"foreground":"#79c0ff","token":"support"},{"foreground":"#79c0ff","token":"meta.property-name"},{"foreground":"#ffa657","token":"variable"},{"foreground":"#c9d1d9","token":"variable.other"},{"fontStyle":"italic","foreground":"#ffa198","token":"invalid.broken"},{"fontStyle":"italic","foreground":"#ffa198","token":"invalid.deprecated"},{"fontStyle":"italic","foreground":"#ffa198","token":"invalid.illegal"},{"fontStyle":"italic","foreground":"#ffa198","token":"invalid.unimplemented"},{"fontStyle":"italic underline","background":"#ff7b72","foreground":"#0d1117","content":"^M","token":"carriage-return"},{"foreground":"#ffa198","token":"message.error"},{"foreground":"#c9d1d9","token":"string source"},{"foreground":"#79c0ff","token":"string variable"},{"foreground":"#a5d6ff","token":"source.regexp"},{"foreground":"#a5d6ff","token":"string.regexp"},{"foreground":"#a5d6ff","token":"string.regexp.character-class"},{"foreground":"#a5d6ff","token":"string.regexp constant.character.escape"},{"foreground":"#a5d6ff","token":"string.regexp source.ruby.embedded"},{"foreground":"#a5d6ff","token":"string.regexp string.regexp.arbitrary-repitition"},{"fontStyle":"bold","foreground":"#7ee787","token":"string.regexp constant.character.escape"},{"foreground":"#79c0ff","token":"support.constant"},{"foreground":"#79c0ff","token":"support.variable"},{"foreground":"#79c0ff","token":"meta.module-reference"},{"foreground":"#ffa657","token":"punctuation.definition.list.begin.markdown"},{"fontStyle":"bold","foreground":"#79c0ff","token":"markup.heading"},{"fontStyle":"bold","foreground":"#79c0ff","token":"markup.heading entity.name"},{"foreground":"#7ee787","token":"markup.quote"},{"fontStyle":"italic","foreground":"#c9d1d9","token":"markup.italic"},{"fontStyle":"bold","foreground":"#c9d1d9","token":"markup.bold"},{"foreground":"#79c0ff","token":"markup.raw"},{"background":"#490202","foreground":"#ffa198","token":"markup.deleted"},{"background":"#490202","foreground":"#ffa198","token":"meta.diff.header.from-file"},{"background":"#490202","foreground":"#ffa198","token":"punctuation.definition.deleted"},{"background":"#04260f","foreground":"#7ee787","token":"markup.inserted"},{"background":"#04260f","foreground":"#7ee787","token":"meta.diff.header.to-file"},{"background":"#04260f","foreground":"#7ee787","token":"punctuation.definition.inserted"},{"background":"#5a1e02","foreground":"#ffa657","token":"markup.changed"},{"background":"#5a1e02","foreground":"#ffa657","token":"punctuation.definition.changed"},{"foreground":"#161b22","background":"#79c0ff","token":"markup.ignored"},{"foreground":"#161b22","background":"#79c0ff","token":"markup.untracked"},{"foreground":"#d2a8ff","fontStyle":"bold","token":"meta.diff.range"},{"foreground":"#79c0ff","token":"meta.diff.header"},{"fontStyle":"bold","foreground":"#79c0ff","token":"meta.separator"},{"foreground":"#79c0ff","token":"meta.output"},{"foreground":"#8b949e","token":"brackethighlighter.tag"},{"foreground":"#8b949e","token":"brackethighlighter.curly"},{"foreground":"#8b949e","token":"brackethighlighter.round"},{"foreground":"#8b949e","token":"brackethighlighter.square"},{"foreground":"#8b949e","token":"brackethighlighter.angle"},{"foreground":"#8b949e","token":"brackethighlighter.quote"},{"foreground":"#ffa198","token":"brackethighlighter.unmatched"},{"foreground":"#a5d6ff","fontStyle":"underline","token":"constant.other.reference.link"},{"foreground":"#a5d6ff","fontStyle":"underline","token":"string.other.link"}],"encodedTokensColors":[]}');

/***/ }),

/***/ "../app-frontend/src/assets/github-theme/light.json":
/*!**********************************************************!*\
  !*** ../app-frontend/src/assets/github-theme/light.json ***!
  \**********************************************************/
/***/ ((module) => {

module.exports = JSON.parse('{"inherit":true,"base":"vs","colors":{"focusBorder":"#0366d6","foreground":"#24292e","descriptionForeground":"#6a737d","errorForeground":"#cb2431","textLink.foreground":"#0366d6","textLink.activeForeground":"#0366d6","textBlockQuote.background":"#f6f8fa","textBlockQuote.border":"#dfe2e5","textCodeBlock.background":"#1b1f230d","textPreformat.foreground":"#586069","textSeparator.foreground":"#eaecef","button.background":"#2ea44f","button.foreground":"#ffffff","button.hoverBackground":"#2c974b","button.secondaryBackground":"#eaecef","button.secondaryForeground":"#24292e","button.secondaryHoverBackground":"#f3f4f6","checkbox.background":"#f6f8fa","checkbox.border":"#e1e4e8","dropdown.background":"#ffffff","dropdown.border":"#e1e4e8","dropdown.foreground":"#24292e","dropdown.listBackground":"#ffffff","input.background":"#ffffff","input.border":"#e1e4e8","input.foreground":"#24292e","input.placeholderForeground":"#6a737d","badge.foreground":"#005cc5","badge.background":"#dbedff","progressBar.background":"#2188ff","titleBar.activeForeground":"#586069","titleBar.activeBackground":"#ffffff","titleBar.inactiveForeground":"#6a737d","titleBar.inactiveBackground":"#f6f8fa","titleBar.border":"#e1e4e8","activityBar.foreground":"#24292e","activityBar.inactiveForeground":"#6a737d","activityBar.background":"#ffffff","activityBarBadge.foreground":"#ffffff","activityBarBadge.background":"#2188ff","activityBar.activeBorder":"#f9826c","activityBar.border":"#e1e4e8","sideBar.foreground":"#24292e","sideBar.background":"#f6f8fa","sideBar.border":"#e1e4e8","sideBarTitle.foreground":"#24292e","sideBarSectionHeader.foreground":"#24292e","sideBarSectionHeader.background":"#f6f8fa","sideBarSectionHeader.border":"#e1e4e8","list.hoverForeground":"#24292e","list.inactiveSelectionForeground":"#24292e","list.activeSelectionForeground":"#24292e","list.hoverBackground":"#ebf0f4","list.inactiveSelectionBackground":"#e8eaed","list.activeSelectionBackground":"#e2e5e9","list.focusForeground":"#05264c","list.focusBackground":"#cce5ff","list.inactiveFocusBackground":"#dbedff","list.highlightForeground":"#0366d6","tree.indentGuidesStroke":"#eaecef","notificationCenterHeader.foreground":"#6a737d","notificationCenterHeader.background":"#e1e4e8","notifications.foreground":"#586069","notifications.background":"#fafbfc","notifications.border":"#e1e4e8","notificationsErrorIcon.foreground":"#d73a49","notificationsWarningIcon.foreground":"#e36209","notificationsInfoIcon.foreground":"#005cc5","pickerGroup.border":"#e1e4e8","pickerGroup.foreground":"#586069","quickInput.background":"#fafbfc","quickInput.foreground":"#24292e","statusBar.foreground":"#586069","statusBar.background":"#ffffff","statusBar.border":"#e1e4e8","statusBar.noFolderBackground":"#ffffff","statusBar.debuggingBackground":"#d73a49","statusBar.debuggingForeground":"#ffffff","statusBarItem.prominentBackground":"#f6f8fa","editorGroupHeader.tabsBackground":"#f6f8fa","editorGroupHeader.tabsBorder":"#e1e4e8","editorGroup.border":"#e1e4e8","tab.activeForeground":"#24292e","tab.inactiveForeground":"#6a737d","tab.inactiveBackground":"#f6f8fa","tab.activeBackground":"#ffffff","tab.hoverBackground":"#ffffff","tab.unfocusedHoverBackground":"#f6f8fa","tab.border":"#e1e4e8","tab.unfocusedActiveBorderTop":"#e1e4e8","tab.activeBorder":"#ffffff","tab.unfocusedActiveBorder":"#ffffff","tab.activeBorderTop":"#f9826c","breadcrumb.foreground":"#6a737d","breadcrumb.focusForeground":"#24292e","breadcrumb.activeSelectionForeground":"#586069","breadcrumbPicker.background":"#ffffff","editor.foreground":"#24292e","editor.background":"#ffffff","editorWidget.background":"#ffffff","editor.foldBackground":"#959da51a","editor.lineHighlightBackground":"#fafbfc","editorLineNumber.foreground":"#959da5","editorLineNumber.activeForeground":"#24292e","editorIndentGuide.background":"#eaecef","editorIndentGuide.activeBackground":"#e1e4e8","editorWhitespace.foreground":"#d1d5da","editorCursor.foreground":"#044289","editor.findMatchBackground":"#ffdf5d","editor.findMatchHighlightBackground":"#ffdf5d66","editor.linkedEditingBackground":"#0366d611","editor.inactiveSelectionBackground":"#0366d611","editor.selectionBackground":"#0366d625","editor.selectionHighlightBackground":"#34d05840","editor.selectionHighlightBorder":"#34d05800","editor.wordHighlightBackground":"#34d05800","editor.wordHighlightStrongBackground":"#34d05800","editor.wordHighlightBorder":"#24943e99","editor.wordHighlightStrongBorder":"#24943e50","editorBracketMatch.background":"#34d05840","editorBracketMatch.border":"#34d05800","editorGutter.modifiedBackground":"#f9c513","editorGutter.addedBackground":"#34d058","editorGutter.deletedBackground":"#d73a49","diffEditor.insertedTextBackground":"#85e89d33","diffEditor.removedTextBackground":"#f9758326","scrollbar.shadow":"#6a737d33","scrollbarSlider.background":"#959da533","scrollbarSlider.hoverBackground":"#959da544","scrollbarSlider.activeBackground":"#959da588","editorOverviewRuler.border":"#ffffff","panel.background":"#f6f8fa","panel.border":"#e1e4e8","panelTitle.activeBorder":"#f9826c","panelTitle.activeForeground":"#24292e","panelTitle.inactiveForeground":"#6a737d","panelInput.border":"#e1e4e8","terminal.foreground":"#586069","terminal.ansiBlack":"#24292e","terminal.ansiRed":"#d73a49","terminal.ansiGreen":"#22863a","terminal.ansiYellow":"#b08800","terminal.ansiBlue":"#0366d6","terminal.ansiMagenta":"#6f42c1","terminal.ansiCyan":"#1b7c83","terminal.ansiWhite":"#6a737d","terminal.ansiBrightBlack":"#586069","terminal.ansiBrightRed":"#cb2431","terminal.ansiBrightGreen":"#28a745","terminal.ansiBrightYellow":"#dbab09","terminal.ansiBrightBlue":"#2188ff","terminal.ansiBrightMagenta":"#8a63d2","terminal.ansiBrightCyan":"#3192aa","terminal.ansiBrightWhite":"#959da5","gitDecoration.addedResourceForeground":"#22863a","gitDecoration.modifiedResourceForeground":"#b08800","gitDecoration.deletedResourceForeground":"#cb2431","gitDecoration.untrackedResourceForeground":"#22863a","gitDecoration.ignoredResourceForeground":"#959da5","gitDecoration.conflictingResourceForeground":"#b08800","gitDecoration.submoduleResourceForeground":"#586069","debugToolBar.background":"#ffffff","editor.stackFrameHighlightBackground":"#ffd33d33","editor.focusedStackFrameHighlightBackground":"#28a74525","settings.headerForeground":"#586069","settings.modifiedItemIndicator":"#f9c513","welcomePage.buttonBackground":"#fafbfc","welcomePage.buttonHoverBackground":"#f3f4f6"},"rules":[{"foreground":"#6a737d","token":"comment"},{"foreground":"#6a737d","token":"punctuation.definition.comment"},{"foreground":"#6a737d","token":"string.comment"},{"foreground":"#005cc5","token":"constant"},{"foreground":"#005cc5","token":"entity.name.constant"},{"foreground":"#005cc5","token":"variable.other.constant"},{"foreground":"#005cc5","token":"variable.language"},{"foreground":"#005cc5","token":"entity"},{"foreground":"#e36209","token":"entity.name"},{"foreground":"#e36209","token":"meta.export.default"},{"foreground":"#e36209","token":"meta.definition.variable"},{"foreground":"#24292e","token":"variable.parameter.function"},{"foreground":"#24292e","token":"meta.jsx.children"},{"foreground":"#24292e","token":"meta.block"},{"foreground":"#24292e","token":"meta.tag.attributes"},{"foreground":"#24292e","token":"entity.name.constant"},{"foreground":"#24292e","token":"meta.object.member"},{"foreground":"#24292e","token":"meta.embedded.expression"},{"foreground":"#6f42c1","token":"entity.name.function"},{"foreground":"#22863a","token":"entity.name.tag"},{"foreground":"#22863a","token":"support.class.component"},{"foreground":"#d73a49","token":"keyword"},{"foreground":"#d73a49","token":"storage"},{"foreground":"#d73a49","token":"storage.type"},{"foreground":"#24292e","token":"storage.modifier.package"},{"foreground":"#24292e","token":"storage.modifier.import"},{"foreground":"#24292e","token":"storage.type.java"},{"foreground":"#032f62","token":"string"},{"foreground":"#032f62","token":"punctuation.definition.string"},{"foreground":"#032f62","token":"string punctuation.section.embedded source"},{"foreground":"#005cc5","token":"support"},{"foreground":"#005cc5","token":"meta.property-name"},{"foreground":"#e36209","token":"variable"},{"foreground":"#24292e","token":"variable.other"},{"fontStyle":"italic","foreground":"#b31d28","token":"invalid.broken"},{"fontStyle":"italic","foreground":"#b31d28","token":"invalid.deprecated"},{"fontStyle":"italic","foreground":"#b31d28","token":"invalid.illegal"},{"fontStyle":"italic","foreground":"#b31d28","token":"invalid.unimplemented"},{"fontStyle":"italic underline","background":"#d73a49","foreground":"#fafbfc","content":"^M","token":"carriage-return"},{"foreground":"#b31d28","token":"message.error"},{"foreground":"#24292e","token":"string source"},{"foreground":"#005cc5","token":"string variable"},{"foreground":"#032f62","token":"source.regexp"},{"foreground":"#032f62","token":"string.regexp"},{"foreground":"#032f62","token":"string.regexp.character-class"},{"foreground":"#032f62","token":"string.regexp constant.character.escape"},{"foreground":"#032f62","token":"string.regexp source.ruby.embedded"},{"foreground":"#032f62","token":"string.regexp string.regexp.arbitrary-repitition"},{"fontStyle":"bold","foreground":"#22863a","token":"string.regexp constant.character.escape"},{"foreground":"#005cc5","token":"support.constant"},{"foreground":"#005cc5","token":"support.variable"},{"foreground":"#005cc5","token":"meta.module-reference"},{"foreground":"#e36209","token":"punctuation.definition.list.begin.markdown"},{"fontStyle":"bold","foreground":"#005cc5","token":"markup.heading"},{"fontStyle":"bold","foreground":"#005cc5","token":"markup.heading entity.name"},{"foreground":"#22863a","token":"markup.quote"},{"fontStyle":"italic","foreground":"#24292e","token":"markup.italic"},{"fontStyle":"bold","foreground":"#24292e","token":"markup.bold"},{"foreground":"#005cc5","token":"markup.raw"},{"background":"#ffeef0","foreground":"#b31d28","token":"markup.deleted"},{"background":"#ffeef0","foreground":"#b31d28","token":"meta.diff.header.from-file"},{"background":"#ffeef0","foreground":"#b31d28","token":"punctuation.definition.deleted"},{"background":"#f0fff4","foreground":"#22863a","token":"markup.inserted"},{"background":"#f0fff4","foreground":"#22863a","token":"meta.diff.header.to-file"},{"background":"#f0fff4","foreground":"#22863a","token":"punctuation.definition.inserted"},{"background":"#ffebda","foreground":"#e36209","token":"markup.changed"},{"background":"#ffebda","foreground":"#e36209","token":"punctuation.definition.changed"},{"foreground":"#f6f8fa","background":"#005cc5","token":"markup.ignored"},{"foreground":"#f6f8fa","background":"#005cc5","token":"markup.untracked"},{"foreground":"#6f42c1","fontStyle":"bold","token":"meta.diff.range"},{"foreground":"#005cc5","token":"meta.diff.header"},{"fontStyle":"bold","foreground":"#005cc5","token":"meta.separator"},{"foreground":"#005cc5","token":"meta.output"},{"foreground":"#586069","token":"brackethighlighter.tag"},{"foreground":"#586069","token":"brackethighlighter.curly"},{"foreground":"#586069","token":"brackethighlighter.round"},{"foreground":"#586069","token":"brackethighlighter.square"},{"foreground":"#586069","token":"brackethighlighter.angle"},{"foreground":"#586069","token":"brackethighlighter.quote"},{"foreground":"#b31d28","token":"brackethighlighter.unmatched"},{"foreground":"#032f62","fontStyle":"underline","token":"constant.other.reference.link"},{"foreground":"#032f62","fontStyle":"underline","token":"string.other.link"}],"encodedTokensColors":[]}');

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29kZUVkaXRvci5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7O0FBQ0E7QUFFQTtDQUdBOztBQUNBLHVNQUNBOztBQUNBO0FBRUE7QUFDQSxzQkFEQTtBQUdBO0FBQ0E7QUFEQSxHQUhBO0FBT0E7QUFDQTtBQUNBLGtCQURBO0FBRUE7QUFGQSxLQURBO0FBS0E7QUFDQSxrQkFEQTtBQUVBO0FBRkEsS0FMQTtBQVNBO0FBQ0Esa0JBREE7QUFFQTtBQUZBLEtBVEE7QUFhQTtBQUNBLGtCQURBO0FBRUE7QUFGQSxLQWJBO0FBaUJBO0FBQ0Esa0JBREE7QUFFQTtBQUZBLEtBakJBO0FBcUJBO0FBQ0EsbUJBREE7QUFFQTtBQUZBO0FBckJBLEdBUEE7QUFrQ0E7QUFDQTtBQUNBLGdCQURBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFQQSxLQURBOztBQVdBO0FBQ0E7QUFDQTs7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBbEJBOztBQW9CQTtBQUNBO0FBQ0E7O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQTNCQTs7QUE2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBbENBOztBQW9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQXhDQSxHQWxDQTs7QUE2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUZBO0FBR0EsR0FsRkE7O0FBb0ZBO0FBQ0E7QUFDQSxHQXRGQTs7QUF3RkE7QUFDQTtBQUNBO0FBRUEsMEVBQ0E7QUFDQSx5QkFEQTtBQUVBLHlCQUZBO0FBR0E7QUFIQSxPQURBLEVBTUEsWUFOQTs7QUFTQTtBQUNBO0FBQ0Esd0RBQ0EsYUFEQSxFQUVBLGFBRkE7QUFJQSx3REFDQSxVQURBLEVBRUEsYUFGQTtBQUlBO0FBQ0EsaUNBREE7QUFFQTtBQUZBO0FBSUEsT0FkQSxNQWNBO0FBQ0E7QUFDQSxPQTVCQSxDQThCQTs7O0FBQ0E7QUFDQTtBQUNBOztBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BTEE7QUFPQTtBQUNBLEtBekNBOztBQTJDQTtBQUNBO0FBQ0E7QUFDQSxLQTlDQTs7QUFnREE7QUFDQTtBQUNBLEtBbERBOztBQW9EQTtBQUNBO0FBQ0EsS0F0REE7O0FBd0RBO0FBQ0E7QUFDQSxLQTFEQTs7QUE0REE7QUFDQTtBQUNBOztBQTlEQTtBQXhGQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNYeUY7QUFDM0I7QUFDTDs7O0FBR3pEO0FBQ0EsQ0FBbUc7QUFDbkcsZ0JBQWdCLHVHQUFVO0FBQzFCLEVBQUUsZ0ZBQU07QUFDUixFQUFFLGtGQUFNO0FBQ1IsRUFBRSwyRkFBZTtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxJQUFJLEtBQVUsRUFBRSxZQWlCZjtBQUNEO0FBQ0EsaUVBQWU7Ozs7Ozs7Ozs7Ozs7OztBQ3RDNkssQ0FBQyxpRUFBZSwrS0FBRyxFQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FFQWhOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9hcHAtZnJvbnRlbmQvc3JjL2ZlYXR1cmVzL2NvZGUvQ29kZUVkaXRvci52dWUiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlP2U3YzMiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlP2I5YjAiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlP2U1ODkiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlPzJmNDIiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbi8vIEZvcmsgb2YgaHR0cHM6Ly9naXRodWIuY29tL2Vnb2lzdC92dWUtbW9uYWNvL1xuXG5pbXBvcnQgKiBhcyBtb25hY28gZnJvbSAnbW9uYWNvLWVkaXRvcidcbmltcG9ydCBhc3NpZ24gZnJvbSAnbG9kYXNoL21lcmdlJ1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXZhci1yZXF1aXJlc1xubW9uYWNvLmVkaXRvci5kZWZpbmVUaGVtZSgnZ2l0aHViLWxpZ2h0JywgcmVxdWlyZSgnQGZyb250L2Fzc2V0cy9naXRodWItdGhlbWUvbGlnaHQuanNvbicpKVxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby12YXItcmVxdWlyZXNcbm1vbmFjby5lZGl0b3IuZGVmaW5lVGhlbWUoJ2dpdGh1Yi1kYXJrJywgcmVxdWlyZSgnQGZyb250L2Fzc2V0cy9naXRodWItdGhlbWUvZGFyay5qc29uJykpXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgbmFtZTogJ01vbmFjb0VkaXRvcicsXG5cbiAgbW9kZWw6IHtcbiAgICBldmVudDogJ2NoYW5nZScsXG4gIH0sXG5cbiAgcHJvcHM6IHtcbiAgICBvcmlnaW5hbDoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICB9LFxuICAgIHZhbHVlOiB7XG4gICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICB9LFxuICAgIHRoZW1lOiB7XG4gICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICBkZWZhdWx0OiAndnMnLFxuICAgIH0sXG4gICAgbGFuZ3VhZ2U6IHtcbiAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgfSxcbiAgICBvcHRpb25zOiB7XG4gICAgICB0eXBlOiBPYmplY3QsXG4gICAgICBkZWZhdWx0OiBudWxsLFxuICAgIH0sXG4gICAgZGlmZkVkaXRvcjoge1xuICAgICAgdHlwZTogQm9vbGVhbixcbiAgICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIH0sXG4gIH0sXG5cbiAgd2F0Y2g6IHtcbiAgICBvcHRpb25zOiB7XG4gICAgICBkZWVwOiB0cnVlLFxuICAgICAgaGFuZGxlciAob3B0aW9ucykge1xuICAgICAgICBpZiAodGhpcy5lZGl0b3IpIHtcbiAgICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmdldE1vZGlmaWVkRWRpdG9yKClcbiAgICAgICAgICBlZGl0b3IudXBkYXRlT3B0aW9ucyhvcHRpb25zKVxuICAgICAgICB9XG4gICAgICB9LFxuICAgIH0sXG5cbiAgICB2YWx1ZSAobmV3VmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmVkaXRvcikge1xuICAgICAgICBjb25zdCBlZGl0b3IgPSB0aGlzLmdldE1vZGlmaWVkRWRpdG9yKClcbiAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSBlZGl0b3IuZ2V0VmFsdWUoKSkge1xuICAgICAgICAgIGVkaXRvci5zZXRWYWx1ZShuZXdWYWx1ZSlcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG5cbiAgICBvcmlnaW5hbCAobmV3VmFsdWUpIHtcbiAgICAgIGlmICh0aGlzLmVkaXRvciAmJiB0aGlzLmRpZmZFZGl0b3IpIHtcbiAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5nZXRPcmlnaW5hbEVkaXRvcigpXG4gICAgICAgIGlmIChuZXdWYWx1ZSAhPT0gZWRpdG9yLmdldFZhbHVlKCkpIHtcbiAgICAgICAgICBlZGl0b3Iuc2V0VmFsdWUobmV3VmFsdWUpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuXG4gICAgbGFuZ3VhZ2UgKG5ld1ZhbCkge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuZ2V0TW9kaWZpZWRFZGl0b3IoKVxuICAgICAgICB0aGlzLm1vbmFjby5lZGl0b3Iuc2V0TW9kZWxMYW5ndWFnZShlZGl0b3IuZ2V0TW9kZWwoKSwgbmV3VmFsKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICB0aGVtZSAobmV3VmFsKSB7XG4gICAgICBpZiAodGhpcy5lZGl0b3IpIHtcbiAgICAgICAgdGhpcy5tb25hY28uZWRpdG9yLnNldFRoZW1lKG5ld1ZhbClcbiAgICAgIH1cbiAgICB9LFxuICB9LFxuXG4gIG1vdW50ZWQgKCkge1xuICAgIHRoaXMubW9uYWNvID0gbW9uYWNvXG4gICAgdGhpcy4kbmV4dFRpY2soKCkgPT4ge1xuICAgICAgdGhpcy5pbml0TW9uYWNvKG1vbmFjbylcbiAgICB9KVxuICB9LFxuXG4gIGJlZm9yZURlc3Ryb3kgKCkge1xuICAgIHRoaXMuZWRpdG9yICYmIHRoaXMuZWRpdG9yLmRpc3Bvc2UoKVxuICB9LFxuXG4gIG1ldGhvZHM6IHtcbiAgICBpbml0TW9uYWNvIChtb25hY28pIHtcbiAgICAgIHRoaXMuJGVtaXQoJ2VkaXRvcldpbGxNb3VudCcsIHRoaXMubW9uYWNvKVxuXG4gICAgICBjb25zdCBvcHRpb25zID0gYXNzaWduKFxuICAgICAgICB7XG4gICAgICAgICAgdmFsdWU6IHRoaXMudmFsdWUsXG4gICAgICAgICAgdGhlbWU6IHRoaXMudGhlbWUsXG4gICAgICAgICAgbGFuZ3VhZ2U6IHRoaXMubGFuZ3VhZ2UsXG4gICAgICAgIH0sXG4gICAgICAgIHRoaXMub3B0aW9ucyxcbiAgICAgIClcblxuICAgICAgaWYgKHRoaXMuZGlmZkVkaXRvcikge1xuICAgICAgICB0aGlzLmVkaXRvciA9IG1vbmFjby5lZGl0b3IuY3JlYXRlRGlmZkVkaXRvcih0aGlzLiRlbCwgb3B0aW9ucylcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxNb2RlbCA9IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXG4gICAgICAgICAgdGhpcy5vcmlnaW5hbCxcbiAgICAgICAgICB0aGlzLmxhbmd1YWdlLFxuICAgICAgICApXG4gICAgICAgIGNvbnN0IG1vZGlmaWVkTW9kZWwgPSBtb25hY28uZWRpdG9yLmNyZWF0ZU1vZGVsKFxuICAgICAgICAgIHRoaXMudmFsdWUsXG4gICAgICAgICAgdGhpcy5sYW5ndWFnZSxcbiAgICAgICAgKVxuICAgICAgICB0aGlzLmVkaXRvci5zZXRNb2RlbCh7XG4gICAgICAgICAgb3JpZ2luYWw6IG9yaWdpbmFsTW9kZWwsXG4gICAgICAgICAgbW9kaWZpZWQ6IG1vZGlmaWVkTW9kZWwsXG4gICAgICAgIH0pXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmVkaXRvciA9IG1vbmFjby5lZGl0b3IuY3JlYXRlKHRoaXMuJGVsLCBvcHRpb25zKVxuICAgICAgfVxuXG4gICAgICAvLyBAZXZlbnQgYGNoYW5nZWBcbiAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuZ2V0TW9kaWZpZWRFZGl0b3IoKVxuICAgICAgZWRpdG9yLm9uRGlkQ2hhbmdlTW9kZWxDb250ZW50KGV2ZW50ID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBlZGl0b3IuZ2V0VmFsdWUoKVxuICAgICAgICBpZiAodGhpcy52YWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICB0aGlzLiRlbWl0KCdjaGFuZ2UnLCB2YWx1ZSwgZXZlbnQpXG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIHRoaXMuJGVtaXQoJ2VkaXRvckRpZE1vdW50JywgdGhpcy5lZGl0b3IpXG4gICAgfSxcblxuICAgIC8qKiBAZGVwcmVjYXRlZCAqL1xuICAgIGdldE1vbmFjbyAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5lZGl0b3JcbiAgICB9LFxuXG4gICAgZ2V0RWRpdG9yICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmVkaXRvclxuICAgIH0sXG5cbiAgICBnZXRNb2RpZmllZEVkaXRvciAoKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaWZmRWRpdG9yID8gdGhpcy5lZGl0b3IuZ2V0TW9kaWZpZWRFZGl0b3IoKSA6IHRoaXMuZWRpdG9yXG4gICAgfSxcblxuICAgIGdldE9yaWdpbmFsRWRpdG9yICgpIHtcbiAgICAgIHJldHVybiB0aGlzLmRpZmZFZGl0b3IgPyB0aGlzLmVkaXRvci5nZXRPcmlnaW5hbEVkaXRvcigpIDogdGhpcy5lZGl0b3JcbiAgICB9LFxuXG4gICAgZm9jdXMgKCkge1xuICAgICAgdGhpcy5lZGl0b3IuZm9jdXMoKVxuICAgIH0sXG4gIH0sXG59XG48L3NjcmlwdD5cblxuPHRlbXBsYXRlPlxuICA8ZGl2IC8+XG48L3RlbXBsYXRlPlxuIiwiaW1wb3J0IHsgcmVuZGVyLCBzdGF0aWNSZW5kZXJGbnMgfSBmcm9tIFwiLi9Db2RlRWRpdG9yLnZ1ZT92dWUmdHlwZT10ZW1wbGF0ZSZpZD02ZmU2ZjZjOCZcIlxuaW1wb3J0IHNjcmlwdCBmcm9tIFwiLi9Db2RlRWRpdG9yLnZ1ZT92dWUmdHlwZT1zY3JpcHQmbGFuZz1qcyZcIlxuZXhwb3J0ICogZnJvbSBcIi4vQ29kZUVkaXRvci52dWU/dnVlJnR5cGU9c2NyaXB0Jmxhbmc9anMmXCJcblxuXG4vKiBub3JtYWxpemUgY29tcG9uZW50ICovXG5pbXBvcnQgbm9ybWFsaXplciBmcm9tIFwiIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9ydW50aW1lL2NvbXBvbmVudE5vcm1hbGl6ZXIuanNcIlxudmFyIGNvbXBvbmVudCA9IG5vcm1hbGl6ZXIoXG4gIHNjcmlwdCxcbiAgcmVuZGVyLFxuICBzdGF0aWNSZW5kZXJGbnMsXG4gIGZhbHNlLFxuICBudWxsLFxuICBudWxsLFxuICBudWxsXG4gIFxuKVxuXG4vKiBob3QgcmVsb2FkICovXG5pZiAobW9kdWxlLmhvdCkge1xuICB2YXIgYXBpID0gcmVxdWlyZShcIkM6XFxcXFVzZXJzXFxcXGxpYW5nXFxcXERvd25sb2Fkc1xcXFxkZXZ0b29scy02LjAuMC1iZXRhLjIxXFxcXG5vZGVfbW9kdWxlc1xcXFx2dWUtaG90LXJlbG9hZC1hcGlcXFxcZGlzdFxcXFxpbmRleC5qc1wiKVxuICBhcGkuaW5zdGFsbChyZXF1aXJlKCd2dWUnKSlcbiAgaWYgKGFwaS5jb21wYXRpYmxlKSB7XG4gICAgbW9kdWxlLmhvdC5hY2NlcHQoKVxuICAgIGlmICghYXBpLmlzUmVjb3JkZWQoJzZmZTZmNmM4JykpIHtcbiAgICAgIGFwaS5jcmVhdGVSZWNvcmQoJzZmZTZmNmM4JywgY29tcG9uZW50Lm9wdGlvbnMpXG4gICAgfSBlbHNlIHtcbiAgICAgIGFwaS5yZWxvYWQoJzZmZTZmNmM4JywgY29tcG9uZW50Lm9wdGlvbnMpXG4gICAgfVxuICAgIG1vZHVsZS5ob3QuYWNjZXB0KFwiLi9Db2RlRWRpdG9yLnZ1ZT92dWUmdHlwZT10ZW1wbGF0ZSZpZD02ZmU2ZjZjOCZcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgYXBpLnJlcmVuZGVyKCc2ZmU2ZjZjOCcsIHtcbiAgICAgICAgcmVuZGVyOiByZW5kZXIsXG4gICAgICAgIHN0YXRpY1JlbmRlckZuczogc3RhdGljUmVuZGVyRm5zXG4gICAgICB9KVxuICAgIH0pXG4gIH1cbn1cbmNvbXBvbmVudC5vcHRpb25zLl9fZmlsZSA9IFwiYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlXCJcbmV4cG9ydCBkZWZhdWx0IGNvbXBvbmVudC5leHBvcnRzIiwiaW1wb3J0IG1vZCBmcm9tIFwiLSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvYmFiZWwtbG9hZGVyL2xpYi9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvaW5kZXguanM/P3Z1ZS1sb2FkZXItb3B0aW9ucyEuL0NvZGVFZGl0b3IudnVlP3Z1ZSZ0eXBlPXNjcmlwdCZsYW5nPWpzJlwiOyBleHBvcnQgZGVmYXVsdCBtb2Q7IGV4cG9ydCAqIGZyb20gXCItIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9iYWJlbC1sb2FkZXIvbGliL2luZGV4LmpzIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9pbmRleC5qcz8/dnVlLWxvYWRlci1vcHRpb25zIS4vQ29kZUVkaXRvci52dWU/dnVlJnR5cGU9c2NyaXB0Jmxhbmc9anMmXCIiLCJleHBvcnQgKiBmcm9tIFwiLSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9saWIvbG9hZGVycy90ZW1wbGF0ZUxvYWRlci5qcz8/dnVlLWxvYWRlci1vcHRpb25zIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2xpYi9pbmRleC5qcz8/dnVlLWxvYWRlci1vcHRpb25zIS4vQ29kZUVkaXRvci52dWU/dnVlJnR5cGU9dGVtcGxhdGUmaWQ9NmZlNmY2YzgmXCIiLCJ2YXIgcmVuZGVyID0gZnVuY3Rpb24gKCkge1xuICB2YXIgX3ZtID0gdGhpc1xuICB2YXIgX2ggPSBfdm0uJGNyZWF0ZUVsZW1lbnRcbiAgdmFyIF9jID0gX3ZtLl9zZWxmLl9jIHx8IF9oXG4gIHJldHVybiBfYyhcImRpdlwiKVxufVxudmFyIHN0YXRpY1JlbmRlckZucyA9IFtdXG5yZW5kZXIuX3dpdGhTdHJpcHBlZCA9IHRydWVcblxuZXhwb3J0IHsgcmVuZGVyLCBzdGF0aWNSZW5kZXJGbnMgfSJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==