"use strict";
(self["webpackChunk_vue_devtools_shell_chrome"] = self["webpackChunk_vue_devtools_shell_chrome"] || []).push([["CodeEditor"],{

/***/ "../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/dist/index.js??ruleSet[0]!../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js":
/*!*************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/dist/index.js??ruleSet[0]!../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js ***!
  \*************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var monaco_editor__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! monaco-editor */ "include-loader!../../node_modules/monaco-editor/esm/vs/editor/editor.main.js");
/* harmony import */ var lodash_merge__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash/merge */ "../../node_modules/lodash/merge.js");
/* harmony import */ var lodash_merge__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash_merge__WEBPACK_IMPORTED_MODULE_1__);
// Fork of https://github.com/egoist/vue-monaco/

 // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports

monaco_editor__WEBPACK_IMPORTED_MODULE_0__.editor.defineTheme('github-light', __webpack_require__(/*! @front/assets/github-theme/light.json */ "../app-frontend/src/assets/github-theme/light.json")); // eslint-disable-next-line ts/no-var-requires, ts/no-require-imports

monaco_editor__WEBPACK_IMPORTED_MODULE_0__.editor.defineTheme('github-dark', __webpack_require__(/*! @front/assets/github-theme/dark.json */ "../app-frontend/src/assets/github-theme/dark.json"));
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  name: 'MonacoEditor',
  props: {
    original: {
      type: String,
      default: null
    },
    modelValue: {
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
  emits: ['update:modelValue', 'editorWillMount', 'editorDidMount'],
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

    modelValue(newValue) {
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

  beforeUnmount() {
    this.editor && this.editor.dispose();
  },

  methods: {
    initMonaco(monaco) {
      this.$emit('editorWillMount', this.monaco);
      const options = lodash_merge__WEBPACK_IMPORTED_MODULE_1___default()({
        value: this.modelValue,
        theme: this.theme,
        language: this.language
      }, this.options);
      const root = this.$refs.root;

      if (this.diffEditor) {
        this.editor = monaco.editor.createDiffEditor(root, options);
        const originalModel = monaco.editor.createModel(this.original, this.language);
        const modifiedModel = monaco.editor.createModel(this.modelValue, this.language);
        this.editor.setModel({
          original: originalModel,
          modified: modifiedModel
        });
      } else {
        this.editor = monaco.editor.create(root, options);
      } // @event `change`


      const editor = this.getModifiedEditor();
      editor.onDidChangeModelContent(event => {
        const value = editor.getValue();

        if (this.modelValue !== value) {
          this.$emit('update:modelValue', value, event);
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

/***/ "../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[3]!../../node_modules/vue-loader/dist/index.js??ruleSet[0]!../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8":
/*!*********************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[3]!../../node_modules/vue-loader/dist/index.js??ruleSet[0]!../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8 ***!
  \*********************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   render: () => (/* binding */ render)
/* harmony export */ });
/* harmony import */ var vue__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! vue */ "../../node_modules/vue/dist/vue.esm-bundler.js");

const _hoisted_1 = {
  ref: "root"
};
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (0,vue__WEBPACK_IMPORTED_MODULE_0__.openBlock)(), (0,vue__WEBPACK_IMPORTED_MODULE_0__.createElementBlock)("div", _hoisted_1, null, 512
  /* NEED_PATCH */
  );
}

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
/* harmony import */ var _CodeEditor_vue_vue_type_template_id_6fe6f6c8__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./CodeEditor.vue?vue&type=template&id=6fe6f6c8 */ "../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8");
/* harmony import */ var _CodeEditor_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./CodeEditor.vue?vue&type=script&lang=js */ "../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js");
/* harmony import */ var _node_modules_vue_loader_dist_exportHelper_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../node_modules/vue-loader/dist/exportHelper.js */ "../../node_modules/vue-loader/dist/exportHelper.js");




;
const __exports__ = /*#__PURE__*/(0,_node_modules_vue_loader_dist_exportHelper_js__WEBPACK_IMPORTED_MODULE_2__["default"])(_CodeEditor_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_1__["default"], [['render',_CodeEditor_vue_vue_type_template_id_6fe6f6c8__WEBPACK_IMPORTED_MODULE_0__.render],['__file',"app-frontend/src/features/code/CodeEditor.vue"]])
/* hot reload */
if (false) {}


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__exports__);

/***/ }),

/***/ "../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js":
/*!********************************************************************************!*\
  !*** ../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js ***!
  \********************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* reexport safe */ _node_modules_babel_loader_lib_index_js_node_modules_vue_loader_dist_index_js_ruleSet_0_CodeEditor_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__["default"])
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_node_modules_vue_loader_dist_index_js_ruleSet_0_CodeEditor_vue_vue_type_script_lang_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js!../../../../../node_modules/vue-loader/dist/index.js??ruleSet[0]!./CodeEditor.vue?vue&type=script&lang=js */ "../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/dist/index.js??ruleSet[0]!../app-frontend/src/features/code/CodeEditor.vue?vue&type=script&lang=js");
 

/***/ }),

/***/ "../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8":
/*!**************************************************************************************!*\
  !*** ../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8 ***!
  \**************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   render: () => (/* reexport safe */ _node_modules_babel_loader_lib_index_js_node_modules_vue_loader_dist_templateLoader_js_ruleSet_1_rules_3_node_modules_vue_loader_dist_index_js_ruleSet_0_CodeEditor_vue_vue_type_template_id_6fe6f6c8__WEBPACK_IMPORTED_MODULE_0__.render)
/* harmony export */ });
/* harmony import */ var _node_modules_babel_loader_lib_index_js_node_modules_vue_loader_dist_templateLoader_js_ruleSet_1_rules_3_node_modules_vue_loader_dist_index_js_ruleSet_0_CodeEditor_vue_vue_type_template_id_6fe6f6c8__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! -!../../../../../node_modules/babel-loader/lib/index.js!../../../../../node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[3]!../../../../../node_modules/vue-loader/dist/index.js??ruleSet[0]!./CodeEditor.vue?vue&type=template&id=6fe6f6c8 */ "../../node_modules/babel-loader/lib/index.js!../../node_modules/vue-loader/dist/templateLoader.js??ruleSet[1].rules[3]!../../node_modules/vue-loader/dist/index.js??ruleSet[0]!../app-frontend/src/features/code/CodeEditor.vue?vue&type=template&id=6fe6f6c8");


/***/ }),

/***/ "../app-frontend/src/assets/github-theme/dark.json":
/*!*********************************************************!*\
  !*** ../app-frontend/src/assets/github-theme/dark.json ***!
  \*********************************************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"inherit":true,"base":"vs-dark","colors":{"focusBorder":"#388bfd","foreground":"#c9d1d9","descriptionForeground":"#8b949e","errorForeground":"#f85149","textLink.foreground":"#58a6ff","textLink.activeForeground":"#58a6ff","textBlockQuote.background":"#090c10","textBlockQuote.border":"#3b434b","textCodeBlock.background":"#f0f6fc26","textPreformat.foreground":"#8b949e","textSeparator.foreground":"#21262d","button.background":"#238636","button.foreground":"#ffffff","button.hoverBackground":"#2ea043","button.secondaryBackground":"#292e34","button.secondaryForeground":"#c9d1d9","button.secondaryHoverBackground":"#30363d","checkbox.background":"#161b22","checkbox.border":"#30363d","dropdown.background":"#1c2128","dropdown.border":"#30363d","dropdown.foreground":"#c9d1d9","dropdown.listBackground":"#1c2128","input.background":"#0d1117","input.border":"#21262d","input.foreground":"#c9d1d9","input.placeholderForeground":"#484f58","badge.foreground":"#79c0ff","badge.background":"#0d419d","progressBar.background":"#1f6feb","titleBar.activeForeground":"#8b949e","titleBar.activeBackground":"#0d1117","titleBar.inactiveForeground":"#8b949e","titleBar.inactiveBackground":"#090c10","titleBar.border":"#30363d","activityBar.foreground":"#c9d1d9","activityBar.inactiveForeground":"#8b949e","activityBar.background":"#0d1117","activityBarBadge.foreground":"#f0f6fc","activityBarBadge.background":"#1f6feb","activityBar.activeBorder":"#f78166","activityBar.border":"#30363d","sideBar.foreground":"#c9d1d9","sideBar.background":"#090c10","sideBar.border":"#30363d","sideBarTitle.foreground":"#c9d1d9","sideBarSectionHeader.foreground":"#c9d1d9","sideBarSectionHeader.background":"#090c10","sideBarSectionHeader.border":"#30363d","list.hoverForeground":"#c9d1d9","list.inactiveSelectionForeground":"#c9d1d9","list.activeSelectionForeground":"#c9d1d9","list.hoverBackground":"#161b22","list.inactiveSelectionBackground":"#161b22","list.activeSelectionBackground":"#21262d","list.focusForeground":"#f0f6fc","list.focusBackground":"#21262d","list.inactiveFocusBackground":"#161b22","list.highlightForeground":"#388bfd","tree.indentGuidesStroke":"#21262d","notificationCenterHeader.foreground":"#6e7681","notificationCenterHeader.background":"#0d1117","notifications.foreground":"#8b949e","notifications.background":"#161b22","notifications.border":"#30363d","notificationsErrorIcon.foreground":"#f85149","notificationsWarningIcon.foreground":"#f0883e","notificationsInfoIcon.foreground":"#58a6ff","pickerGroup.border":"#21262d","pickerGroup.foreground":"#8b949e","quickInput.background":"#0d1117","quickInput.foreground":"#c9d1d9","statusBar.foreground":"#8b949e","statusBar.background":"#0d1117","statusBar.border":"#30363d","statusBar.noFolderBackground":"#0d1117","statusBar.debuggingBackground":"#da3633","statusBar.debuggingForeground":"#f0f6fc","statusBarItem.prominentBackground":"#161b22","editorGroupHeader.tabsBackground":"#090c10","editorGroupHeader.tabsBorder":"#30363d","editorGroup.border":"#30363d","tab.activeForeground":"#c9d1d9","tab.inactiveForeground":"#8b949e","tab.inactiveBackground":"#090c10","tab.activeBackground":"#0d1117","tab.hoverBackground":"#0d1117","tab.unfocusedHoverBackground":"#161b22","tab.border":"#30363d","tab.unfocusedActiveBorderTop":"#30363d","tab.activeBorder":"#0d1117","tab.unfocusedActiveBorder":"#0d1117","tab.activeBorderTop":"#f78166","breadcrumb.foreground":"#8b949e","breadcrumb.focusForeground":"#c9d1d9","breadcrumb.activeSelectionForeground":"#8b949e","breadcrumbPicker.background":"#1c2128","editor.foreground":"#c9d1d9","editor.background":"#0d1117","editorWidget.background":"#1c2128","editor.foldBackground":"#6e76811a","editor.lineHighlightBackground":"#161b22","editorLineNumber.foreground":"#8b949e","editorLineNumber.activeForeground":"#c9d1d9","editorIndentGuide.background":"#21262d","editorIndentGuide.activeBackground":"#30363d","editorWhitespace.foreground":"#484f58","editorCursor.foreground":"#79c0ff","editor.findMatchBackground":"#ffd33d44","editor.findMatchHighlightBackground":"#ffd33d22","editor.linkedEditingBackground":"#3392FF22","editor.inactiveSelectionBackground":"#3392FF22","editor.selectionBackground":"#3392FF44","editor.selectionHighlightBackground":"#17E5E633","editor.selectionHighlightBorder":"#17E5E600","editor.wordHighlightBackground":"#17E5E600","editor.wordHighlightStrongBackground":"#17E5E600","editor.wordHighlightBorder":"#17E5E699","editor.wordHighlightStrongBorder":"#17E5E666","editorBracketMatch.background":"#17E5E650","editorBracketMatch.border":"#17E5E600","editorGutter.modifiedBackground":"#9e6a03","editorGutter.addedBackground":"#196c2e","editorGutter.deletedBackground":"#b62324","diffEditor.insertedTextBackground":"#2ea04333","diffEditor.removedTextBackground":"#da363333","scrollbar.shadow":"#0008","scrollbarSlider.background":"#484F5833","scrollbarSlider.hoverBackground":"#484F5844","scrollbarSlider.activeBackground":"#484F5888","editorOverviewRuler.border":"#010409","panel.background":"#090c10","panel.border":"#30363d","panelTitle.activeBorder":"#f78166","panelTitle.activeForeground":"#c9d1d9","panelTitle.inactiveForeground":"#8b949e","panelInput.border":"#30363d","terminal.foreground":"#8b949e","terminal.ansiBlack":"#484f58","terminal.ansiRed":"#ff7b72","terminal.ansiGreen":"#3fb950","terminal.ansiYellow":"#d29922","terminal.ansiBlue":"#58a6ff","terminal.ansiMagenta":"#bc8cff","terminal.ansiCyan":"#39c5cf","terminal.ansiWhite":"#b1bac4","terminal.ansiBrightBlack":"#6e7681","terminal.ansiBrightRed":"#ffa198","terminal.ansiBrightGreen":"#56d364","terminal.ansiBrightYellow":"#e3b341","terminal.ansiBrightBlue":"#79c0ff","terminal.ansiBrightMagenta":"#d2a8ff","terminal.ansiBrightCyan":"#56d4dd","terminal.ansiBrightWhite":"#f0f6fc","gitDecoration.addedResourceForeground":"#56d364","gitDecoration.modifiedResourceForeground":"#e3b341","gitDecoration.deletedResourceForeground":"#f85149","gitDecoration.untrackedResourceForeground":"#56d364","gitDecoration.ignoredResourceForeground":"#484f58","gitDecoration.conflictingResourceForeground":"#e3b341","gitDecoration.submoduleResourceForeground":"#8b949e","debugToolBar.background":"#1c2128","editor.stackFrameHighlightBackground":"#D2992225","editor.focusedStackFrameHighlightBackground":"#3FB95025","peekViewEditor.matchHighlightBackground":"#ffd33d33","peekViewResult.matchHighlightBackground":"#ffd33d33","peekViewEditor.background":"#0d111788","peekViewResult.background":"#0d1117","settings.headerForeground":"#8b949e","settings.modifiedItemIndicator":"#9e6a03","welcomePage.buttonBackground":"#21262d","welcomePage.buttonHoverBackground":"#30363d"},"rules":[{"foreground":"#8b949e","token":"comment"},{"foreground":"#8b949e","token":"punctuation.definition.comment"},{"foreground":"#8b949e","token":"string.comment"},{"foreground":"#79c0ff","token":"constant"},{"foreground":"#79c0ff","token":"entity.name.constant"},{"foreground":"#79c0ff","token":"variable.other.constant"},{"foreground":"#79c0ff","token":"variable.language"},{"foreground":"#79c0ff","token":"entity"},{"foreground":"#ffa657","token":"entity.name"},{"foreground":"#ffa657","token":"meta.export.default"},{"foreground":"#ffa657","token":"meta.definition.variable"},{"foreground":"#c9d1d9","token":"variable.parameter.function"},{"foreground":"#c9d1d9","token":"meta.jsx.children"},{"foreground":"#c9d1d9","token":"meta.block"},{"foreground":"#c9d1d9","token":"meta.tag.attributes"},{"foreground":"#c9d1d9","token":"entity.name.constant"},{"foreground":"#c9d1d9","token":"meta.object.member"},{"foreground":"#c9d1d9","token":"meta.embedded.expression"},{"foreground":"#d2a8ff","token":"entity.name.function"},{"foreground":"#7ee787","token":"entity.name.tag"},{"foreground":"#7ee787","token":"support.class.component"},{"foreground":"#ff7b72","token":"keyword"},{"foreground":"#ff7b72","token":"storage"},{"foreground":"#ff7b72","token":"storage.type"},{"foreground":"#c9d1d9","token":"storage.modifier.package"},{"foreground":"#c9d1d9","token":"storage.modifier.import"},{"foreground":"#c9d1d9","token":"storage.type.java"},{"foreground":"#a5d6ff","token":"string"},{"foreground":"#a5d6ff","token":"punctuation.definition.string"},{"foreground":"#a5d6ff","token":"string punctuation.section.embedded source"},{"foreground":"#79c0ff","token":"support"},{"foreground":"#79c0ff","token":"meta.property-name"},{"foreground":"#ffa657","token":"variable"},{"foreground":"#c9d1d9","token":"variable.other"},{"fontStyle":"italic","foreground":"#ffa198","token":"invalid.broken"},{"fontStyle":"italic","foreground":"#ffa198","token":"invalid.deprecated"},{"fontStyle":"italic","foreground":"#ffa198","token":"invalid.illegal"},{"fontStyle":"italic","foreground":"#ffa198","token":"invalid.unimplemented"},{"fontStyle":"italic underline","background":"#ff7b72","foreground":"#0d1117","content":"^M","token":"carriage-return"},{"foreground":"#ffa198","token":"message.error"},{"foreground":"#c9d1d9","token":"string source"},{"foreground":"#79c0ff","token":"string variable"},{"foreground":"#a5d6ff","token":"source.regexp"},{"foreground":"#a5d6ff","token":"string.regexp"},{"foreground":"#a5d6ff","token":"string.regexp.character-class"},{"foreground":"#a5d6ff","token":"string.regexp constant.character.escape"},{"foreground":"#a5d6ff","token":"string.regexp source.ruby.embedded"},{"foreground":"#a5d6ff","token":"string.regexp string.regexp.arbitrary-repitition"},{"fontStyle":"bold","foreground":"#7ee787","token":"string.regexp constant.character.escape"},{"foreground":"#79c0ff","token":"support.constant"},{"foreground":"#79c0ff","token":"support.variable"},{"foreground":"#79c0ff","token":"meta.module-reference"},{"foreground":"#ffa657","token":"punctuation.definition.list.begin.markdown"},{"fontStyle":"bold","foreground":"#79c0ff","token":"markup.heading"},{"fontStyle":"bold","foreground":"#79c0ff","token":"markup.heading entity.name"},{"foreground":"#7ee787","token":"markup.quote"},{"fontStyle":"italic","foreground":"#c9d1d9","token":"markup.italic"},{"fontStyle":"bold","foreground":"#c9d1d9","token":"markup.bold"},{"foreground":"#79c0ff","token":"markup.raw"},{"background":"#490202","foreground":"#ffa198","token":"markup.deleted"},{"background":"#490202","foreground":"#ffa198","token":"meta.diff.header.from-file"},{"background":"#490202","foreground":"#ffa198","token":"punctuation.definition.deleted"},{"background":"#04260f","foreground":"#7ee787","token":"markup.inserted"},{"background":"#04260f","foreground":"#7ee787","token":"meta.diff.header.to-file"},{"background":"#04260f","foreground":"#7ee787","token":"punctuation.definition.inserted"},{"background":"#5a1e02","foreground":"#ffa657","token":"markup.changed"},{"background":"#5a1e02","foreground":"#ffa657","token":"punctuation.definition.changed"},{"foreground":"#161b22","background":"#79c0ff","token":"markup.ignored"},{"foreground":"#161b22","background":"#79c0ff","token":"markup.untracked"},{"foreground":"#d2a8ff","fontStyle":"bold","token":"meta.diff.range"},{"foreground":"#79c0ff","token":"meta.diff.header"},{"fontStyle":"bold","foreground":"#79c0ff","token":"meta.separator"},{"foreground":"#79c0ff","token":"meta.output"},{"foreground":"#8b949e","token":"brackethighlighter.tag"},{"foreground":"#8b949e","token":"brackethighlighter.curly"},{"foreground":"#8b949e","token":"brackethighlighter.round"},{"foreground":"#8b949e","token":"brackethighlighter.square"},{"foreground":"#8b949e","token":"brackethighlighter.angle"},{"foreground":"#8b949e","token":"brackethighlighter.quote"},{"foreground":"#ffa198","token":"brackethighlighter.unmatched"},{"foreground":"#a5d6ff","fontStyle":"underline","token":"constant.other.reference.link"},{"foreground":"#a5d6ff","fontStyle":"underline","token":"string.other.link"}],"encodedTokensColors":[]}');

/***/ }),

/***/ "../app-frontend/src/assets/github-theme/light.json":
/*!**********************************************************!*\
  !*** ../app-frontend/src/assets/github-theme/light.json ***!
  \**********************************************************/
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"inherit":true,"base":"vs","colors":{"focusBorder":"#0366d6","foreground":"#24292e","descriptionForeground":"#6a737d","errorForeground":"#cb2431","textLink.foreground":"#0366d6","textLink.activeForeground":"#0366d6","textBlockQuote.background":"#f6f8fa","textBlockQuote.border":"#dfe2e5","textCodeBlock.background":"#1b1f230d","textPreformat.foreground":"#586069","textSeparator.foreground":"#eaecef","button.background":"#2ea44f","button.foreground":"#ffffff","button.hoverBackground":"#2c974b","button.secondaryBackground":"#eaecef","button.secondaryForeground":"#24292e","button.secondaryHoverBackground":"#f3f4f6","checkbox.background":"#f6f8fa","checkbox.border":"#e1e4e8","dropdown.background":"#ffffff","dropdown.border":"#e1e4e8","dropdown.foreground":"#24292e","dropdown.listBackground":"#ffffff","input.background":"#ffffff","input.border":"#e1e4e8","input.foreground":"#24292e","input.placeholderForeground":"#6a737d","badge.foreground":"#005cc5","badge.background":"#dbedff","progressBar.background":"#2188ff","titleBar.activeForeground":"#586069","titleBar.activeBackground":"#ffffff","titleBar.inactiveForeground":"#6a737d","titleBar.inactiveBackground":"#f6f8fa","titleBar.border":"#e1e4e8","activityBar.foreground":"#24292e","activityBar.inactiveForeground":"#6a737d","activityBar.background":"#ffffff","activityBarBadge.foreground":"#ffffff","activityBarBadge.background":"#2188ff","activityBar.activeBorder":"#f9826c","activityBar.border":"#e1e4e8","sideBar.foreground":"#24292e","sideBar.background":"#f6f8fa","sideBar.border":"#e1e4e8","sideBarTitle.foreground":"#24292e","sideBarSectionHeader.foreground":"#24292e","sideBarSectionHeader.background":"#f6f8fa","sideBarSectionHeader.border":"#e1e4e8","list.hoverForeground":"#24292e","list.inactiveSelectionForeground":"#24292e","list.activeSelectionForeground":"#24292e","list.hoverBackground":"#ebf0f4","list.inactiveSelectionBackground":"#e8eaed","list.activeSelectionBackground":"#e2e5e9","list.focusForeground":"#05264c","list.focusBackground":"#cce5ff","list.inactiveFocusBackground":"#dbedff","list.highlightForeground":"#0366d6","tree.indentGuidesStroke":"#eaecef","notificationCenterHeader.foreground":"#6a737d","notificationCenterHeader.background":"#e1e4e8","notifications.foreground":"#586069","notifications.background":"#fafbfc","notifications.border":"#e1e4e8","notificationsErrorIcon.foreground":"#d73a49","notificationsWarningIcon.foreground":"#e36209","notificationsInfoIcon.foreground":"#005cc5","pickerGroup.border":"#e1e4e8","pickerGroup.foreground":"#586069","quickInput.background":"#fafbfc","quickInput.foreground":"#24292e","statusBar.foreground":"#586069","statusBar.background":"#ffffff","statusBar.border":"#e1e4e8","statusBar.noFolderBackground":"#ffffff","statusBar.debuggingBackground":"#d73a49","statusBar.debuggingForeground":"#ffffff","statusBarItem.prominentBackground":"#f6f8fa","editorGroupHeader.tabsBackground":"#f6f8fa","editorGroupHeader.tabsBorder":"#e1e4e8","editorGroup.border":"#e1e4e8","tab.activeForeground":"#24292e","tab.inactiveForeground":"#6a737d","tab.inactiveBackground":"#f6f8fa","tab.activeBackground":"#ffffff","tab.hoverBackground":"#ffffff","tab.unfocusedHoverBackground":"#f6f8fa","tab.border":"#e1e4e8","tab.unfocusedActiveBorderTop":"#e1e4e8","tab.activeBorder":"#ffffff","tab.unfocusedActiveBorder":"#ffffff","tab.activeBorderTop":"#f9826c","breadcrumb.foreground":"#6a737d","breadcrumb.focusForeground":"#24292e","breadcrumb.activeSelectionForeground":"#586069","breadcrumbPicker.background":"#ffffff","editor.foreground":"#24292e","editor.background":"#ffffff","editorWidget.background":"#ffffff","editor.foldBackground":"#959da51a","editor.lineHighlightBackground":"#fafbfc","editorLineNumber.foreground":"#959da5","editorLineNumber.activeForeground":"#24292e","editorIndentGuide.background":"#eaecef","editorIndentGuide.activeBackground":"#e1e4e8","editorWhitespace.foreground":"#d1d5da","editorCursor.foreground":"#044289","editor.findMatchBackground":"#ffdf5d","editor.findMatchHighlightBackground":"#ffdf5d66","editor.linkedEditingBackground":"#0366d611","editor.inactiveSelectionBackground":"#0366d611","editor.selectionBackground":"#0366d625","editor.selectionHighlightBackground":"#34d05840","editor.selectionHighlightBorder":"#34d05800","editor.wordHighlightBackground":"#34d05800","editor.wordHighlightStrongBackground":"#34d05800","editor.wordHighlightBorder":"#24943e99","editor.wordHighlightStrongBorder":"#24943e50","editorBracketMatch.background":"#34d05840","editorBracketMatch.border":"#34d05800","editorGutter.modifiedBackground":"#f9c513","editorGutter.addedBackground":"#34d058","editorGutter.deletedBackground":"#d73a49","diffEditor.insertedTextBackground":"#85e89d33","diffEditor.removedTextBackground":"#f9758326","scrollbar.shadow":"#6a737d33","scrollbarSlider.background":"#959da533","scrollbarSlider.hoverBackground":"#959da544","scrollbarSlider.activeBackground":"#959da588","editorOverviewRuler.border":"#ffffff","panel.background":"#f6f8fa","panel.border":"#e1e4e8","panelTitle.activeBorder":"#f9826c","panelTitle.activeForeground":"#24292e","panelTitle.inactiveForeground":"#6a737d","panelInput.border":"#e1e4e8","terminal.foreground":"#586069","terminal.ansiBlack":"#24292e","terminal.ansiRed":"#d73a49","terminal.ansiGreen":"#22863a","terminal.ansiYellow":"#b08800","terminal.ansiBlue":"#0366d6","terminal.ansiMagenta":"#6f42c1","terminal.ansiCyan":"#1b7c83","terminal.ansiWhite":"#6a737d","terminal.ansiBrightBlack":"#586069","terminal.ansiBrightRed":"#cb2431","terminal.ansiBrightGreen":"#28a745","terminal.ansiBrightYellow":"#dbab09","terminal.ansiBrightBlue":"#2188ff","terminal.ansiBrightMagenta":"#8a63d2","terminal.ansiBrightCyan":"#3192aa","terminal.ansiBrightWhite":"#959da5","gitDecoration.addedResourceForeground":"#22863a","gitDecoration.modifiedResourceForeground":"#b08800","gitDecoration.deletedResourceForeground":"#cb2431","gitDecoration.untrackedResourceForeground":"#22863a","gitDecoration.ignoredResourceForeground":"#959da5","gitDecoration.conflictingResourceForeground":"#b08800","gitDecoration.submoduleResourceForeground":"#586069","debugToolBar.background":"#ffffff","editor.stackFrameHighlightBackground":"#ffd33d33","editor.focusedStackFrameHighlightBackground":"#28a74525","settings.headerForeground":"#586069","settings.modifiedItemIndicator":"#f9c513","welcomePage.buttonBackground":"#fafbfc","welcomePage.buttonHoverBackground":"#f3f4f6"},"rules":[{"foreground":"#6a737d","token":"comment"},{"foreground":"#6a737d","token":"punctuation.definition.comment"},{"foreground":"#6a737d","token":"string.comment"},{"foreground":"#005cc5","token":"constant"},{"foreground":"#005cc5","token":"entity.name.constant"},{"foreground":"#005cc5","token":"variable.other.constant"},{"foreground":"#005cc5","token":"variable.language"},{"foreground":"#005cc5","token":"entity"},{"foreground":"#e36209","token":"entity.name"},{"foreground":"#e36209","token":"meta.export.default"},{"foreground":"#e36209","token":"meta.definition.variable"},{"foreground":"#24292e","token":"variable.parameter.function"},{"foreground":"#24292e","token":"meta.jsx.children"},{"foreground":"#24292e","token":"meta.block"},{"foreground":"#24292e","token":"meta.tag.attributes"},{"foreground":"#24292e","token":"entity.name.constant"},{"foreground":"#24292e","token":"meta.object.member"},{"foreground":"#24292e","token":"meta.embedded.expression"},{"foreground":"#6f42c1","token":"entity.name.function"},{"foreground":"#22863a","token":"entity.name.tag"},{"foreground":"#22863a","token":"support.class.component"},{"foreground":"#d73a49","token":"keyword"},{"foreground":"#d73a49","token":"storage"},{"foreground":"#d73a49","token":"storage.type"},{"foreground":"#24292e","token":"storage.modifier.package"},{"foreground":"#24292e","token":"storage.modifier.import"},{"foreground":"#24292e","token":"storage.type.java"},{"foreground":"#032f62","token":"string"},{"foreground":"#032f62","token":"punctuation.definition.string"},{"foreground":"#032f62","token":"string punctuation.section.embedded source"},{"foreground":"#005cc5","token":"support"},{"foreground":"#005cc5","token":"meta.property-name"},{"foreground":"#e36209","token":"variable"},{"foreground":"#24292e","token":"variable.other"},{"fontStyle":"italic","foreground":"#b31d28","token":"invalid.broken"},{"fontStyle":"italic","foreground":"#b31d28","token":"invalid.deprecated"},{"fontStyle":"italic","foreground":"#b31d28","token":"invalid.illegal"},{"fontStyle":"italic","foreground":"#b31d28","token":"invalid.unimplemented"},{"fontStyle":"italic underline","background":"#d73a49","foreground":"#fafbfc","content":"^M","token":"carriage-return"},{"foreground":"#b31d28","token":"message.error"},{"foreground":"#24292e","token":"string source"},{"foreground":"#005cc5","token":"string variable"},{"foreground":"#032f62","token":"source.regexp"},{"foreground":"#032f62","token":"string.regexp"},{"foreground":"#032f62","token":"string.regexp.character-class"},{"foreground":"#032f62","token":"string.regexp constant.character.escape"},{"foreground":"#032f62","token":"string.regexp source.ruby.embedded"},{"foreground":"#032f62","token":"string.regexp string.regexp.arbitrary-repitition"},{"fontStyle":"bold","foreground":"#22863a","token":"string.regexp constant.character.escape"},{"foreground":"#005cc5","token":"support.constant"},{"foreground":"#005cc5","token":"support.variable"},{"foreground":"#005cc5","token":"meta.module-reference"},{"foreground":"#e36209","token":"punctuation.definition.list.begin.markdown"},{"fontStyle":"bold","foreground":"#005cc5","token":"markup.heading"},{"fontStyle":"bold","foreground":"#005cc5","token":"markup.heading entity.name"},{"foreground":"#22863a","token":"markup.quote"},{"fontStyle":"italic","foreground":"#24292e","token":"markup.italic"},{"fontStyle":"bold","foreground":"#24292e","token":"markup.bold"},{"foreground":"#005cc5","token":"markup.raw"},{"background":"#ffeef0","foreground":"#b31d28","token":"markup.deleted"},{"background":"#ffeef0","foreground":"#b31d28","token":"meta.diff.header.from-file"},{"background":"#ffeef0","foreground":"#b31d28","token":"punctuation.definition.deleted"},{"background":"#f0fff4","foreground":"#22863a","token":"markup.inserted"},{"background":"#f0fff4","foreground":"#22863a","token":"meta.diff.header.to-file"},{"background":"#f0fff4","foreground":"#22863a","token":"punctuation.definition.inserted"},{"background":"#ffebda","foreground":"#e36209","token":"markup.changed"},{"background":"#ffebda","foreground":"#e36209","token":"punctuation.definition.changed"},{"foreground":"#f6f8fa","background":"#005cc5","token":"markup.ignored"},{"foreground":"#f6f8fa","background":"#005cc5","token":"markup.untracked"},{"foreground":"#6f42c1","fontStyle":"bold","token":"meta.diff.range"},{"foreground":"#005cc5","token":"meta.diff.header"},{"fontStyle":"bold","foreground":"#005cc5","token":"meta.separator"},{"foreground":"#005cc5","token":"meta.output"},{"foreground":"#586069","token":"brackethighlighter.tag"},{"foreground":"#586069","token":"brackethighlighter.curly"},{"foreground":"#586069","token":"brackethighlighter.round"},{"foreground":"#586069","token":"brackethighlighter.square"},{"foreground":"#586069","token":"brackethighlighter.angle"},{"foreground":"#586069","token":"brackethighlighter.quote"},{"foreground":"#b31d28","token":"brackethighlighter.unmatched"},{"foreground":"#032f62","fontStyle":"underline","token":"constant.other.reference.link"},{"foreground":"#032f62","fontStyle":"underline","token":"string.other.link"}],"encodedTokensColors":[]}');

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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R0QsaUVBQWU7Ozs7Ozs7Ozs7Ozs7OztBQ3RCNksiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9AdnVlLWRldnRvb2xzL3NoZWxsLWNocm9tZS8uLi9hcHAtZnJvbnRlbmQvc3JjL2ZlYXR1cmVzL2NvZGUvQ29kZUVkaXRvci52dWUiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlPzk3MzAiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlPzRlZjQiLCJ3ZWJwYWNrOi8vQHZ1ZS1kZXZ0b29scy9zaGVsbC1jaHJvbWUvLi4vYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlPzJiOTEiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbi8vIEZvcmsgb2YgaHR0cHM6Ly9naXRodWIuY29tL2Vnb2lzdC92dWUtbW9uYWNvL1xuaW1wb3J0ICogYXMgbW9uYWNvIGZyb20gJ21vbmFjby1lZGl0b3InXG5pbXBvcnQgYXNzaWduIGZyb20gJ2xvZGFzaC9tZXJnZSdcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIHRzL25vLXZhci1yZXF1aXJlcywgdHMvbm8tcmVxdWlyZS1pbXBvcnRzXG5tb25hY28uZWRpdG9yLmRlZmluZVRoZW1lKCdnaXRodWItbGlnaHQnLCByZXF1aXJlKCdAZnJvbnQvYXNzZXRzL2dpdGh1Yi10aGVtZS9saWdodC5qc29uJykpXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgdHMvbm8tdmFyLXJlcXVpcmVzLCB0cy9uby1yZXF1aXJlLWltcG9ydHNcbm1vbmFjby5lZGl0b3IuZGVmaW5lVGhlbWUoJ2dpdGh1Yi1kYXJrJywgcmVxdWlyZSgnQGZyb250L2Fzc2V0cy9naXRodWItdGhlbWUvZGFyay5qc29uJykpXG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgbmFtZTogJ01vbmFjb0VkaXRvcicsXG5cbiAgcHJvcHM6IHtcbiAgICBvcmlnaW5hbDoge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICB9LFxuICAgIG1vZGVsVmFsdWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0sXG4gICAgdGhlbWU6IHtcbiAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgIGRlZmF1bHQ6ICd2cycsXG4gICAgfSxcbiAgICBsYW5ndWFnZToge1xuICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgZGVmYXVsdDogbnVsbCxcbiAgICB9LFxuICAgIG9wdGlvbnM6IHtcbiAgICAgIHR5cGU6IE9iamVjdCxcbiAgICAgIGRlZmF1bHQ6IG51bGwsXG4gICAgfSxcbiAgICBkaWZmRWRpdG9yOiB7XG4gICAgICB0eXBlOiBCb29sZWFuLFxuICAgICAgZGVmYXVsdDogZmFsc2UsXG4gICAgfSxcbiAgfSxcblxuICBlbWl0czogWyd1cGRhdGU6bW9kZWxWYWx1ZScsICdlZGl0b3JXaWxsTW91bnQnLCAnZWRpdG9yRGlkTW91bnQnXSxcblxuICB3YXRjaDoge1xuICAgIG9wdGlvbnM6IHtcbiAgICAgIGRlZXA6IHRydWUsXG4gICAgICBoYW5kbGVyKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKHRoaXMuZWRpdG9yKSB7XG4gICAgICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5nZXRNb2RpZmllZEVkaXRvcigpXG4gICAgICAgICAgZWRpdG9yLnVwZGF0ZU9wdGlvbnMob3B0aW9ucylcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgbW9kZWxWYWx1ZShuZXdWYWx1ZSkge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuZ2V0TW9kaWZpZWRFZGl0b3IoKVxuICAgICAgICBpZiAobmV3VmFsdWUgIT09IGVkaXRvci5nZXRWYWx1ZSgpKSB7XG4gICAgICAgICAgZWRpdG9yLnNldFZhbHVlKG5ld1ZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIG9yaWdpbmFsKG5ld1ZhbHVlKSB7XG4gICAgICBpZiAodGhpcy5lZGl0b3IgJiYgdGhpcy5kaWZmRWRpdG9yKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuZ2V0T3JpZ2luYWxFZGl0b3IoKVxuICAgICAgICBpZiAobmV3VmFsdWUgIT09IGVkaXRvci5nZXRWYWx1ZSgpKSB7XG4gICAgICAgICAgZWRpdG9yLnNldFZhbHVlKG5ld1ZhbHVlKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSxcblxuICAgIGxhbmd1YWdlKG5ld1ZhbCkge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yKSB7XG4gICAgICAgIGNvbnN0IGVkaXRvciA9IHRoaXMuZ2V0TW9kaWZpZWRFZGl0b3IoKVxuICAgICAgICB0aGlzLm1vbmFjby5lZGl0b3Iuc2V0TW9kZWxMYW5ndWFnZShlZGl0b3IuZ2V0TW9kZWwoKSwgbmV3VmFsKVxuICAgICAgfVxuICAgIH0sXG5cbiAgICB0aGVtZShuZXdWYWwpIHtcbiAgICAgIGlmICh0aGlzLmVkaXRvcikge1xuICAgICAgICB0aGlzLm1vbmFjby5lZGl0b3Iuc2V0VGhlbWUobmV3VmFsKVxuICAgICAgfVxuICAgIH0sXG4gIH0sXG5cbiAgbW91bnRlZCgpIHtcbiAgICB0aGlzLm1vbmFjbyA9IG1vbmFjb1xuICAgIHRoaXMuJG5leHRUaWNrKCgpID0+IHtcbiAgICAgIHRoaXMuaW5pdE1vbmFjbyhtb25hY28pXG4gICAgfSlcbiAgfSxcblxuICBiZWZvcmVVbm1vdW50KCkge1xuICAgIHRoaXMuZWRpdG9yICYmIHRoaXMuZWRpdG9yLmRpc3Bvc2UoKVxuICB9LFxuXG4gIG1ldGhvZHM6IHtcbiAgICBpbml0TW9uYWNvKG1vbmFjbykge1xuICAgICAgdGhpcy4kZW1pdCgnZWRpdG9yV2lsbE1vdW50JywgdGhpcy5tb25hY28pXG5cbiAgICAgIGNvbnN0IG9wdGlvbnMgPSBhc3NpZ24oXG4gICAgICAgIHtcbiAgICAgICAgICB2YWx1ZTogdGhpcy5tb2RlbFZhbHVlLFxuICAgICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lLFxuICAgICAgICAgIGxhbmd1YWdlOiB0aGlzLmxhbmd1YWdlLFxuICAgICAgICB9LFxuICAgICAgICB0aGlzLm9wdGlvbnMsXG4gICAgICApXG4gICAgICBjb25zdCByb290ID0gdGhpcy4kcmVmcy5yb290XG5cbiAgICAgIGlmICh0aGlzLmRpZmZFZGl0b3IpIHtcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBtb25hY28uZWRpdG9yLmNyZWF0ZURpZmZFZGl0b3Iocm9vdCwgb3B0aW9ucylcbiAgICAgICAgY29uc3Qgb3JpZ2luYWxNb2RlbCA9IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXG4gICAgICAgICAgdGhpcy5vcmlnaW5hbCxcbiAgICAgICAgICB0aGlzLmxhbmd1YWdlLFxuICAgICAgICApXG4gICAgICAgIGNvbnN0IG1vZGlmaWVkTW9kZWwgPSBtb25hY28uZWRpdG9yLmNyZWF0ZU1vZGVsKFxuICAgICAgICAgIHRoaXMubW9kZWxWYWx1ZSxcbiAgICAgICAgICB0aGlzLmxhbmd1YWdlLFxuICAgICAgICApXG4gICAgICAgIHRoaXMuZWRpdG9yLnNldE1vZGVsKHtcbiAgICAgICAgICBvcmlnaW5hbDogb3JpZ2luYWxNb2RlbCxcbiAgICAgICAgICBtb2RpZmllZDogbW9kaWZpZWRNb2RlbCxcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmVkaXRvciA9IG1vbmFjby5lZGl0b3IuY3JlYXRlKHJvb3QsIG9wdGlvbnMpXG4gICAgICB9XG5cbiAgICAgIC8vIEBldmVudCBgY2hhbmdlYFxuICAgICAgY29uc3QgZWRpdG9yID0gdGhpcy5nZXRNb2RpZmllZEVkaXRvcigpXG4gICAgICBlZGl0b3Iub25EaWRDaGFuZ2VNb2RlbENvbnRlbnQoKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZWRpdG9yLmdldFZhbHVlKClcbiAgICAgICAgaWYgKHRoaXMubW9kZWxWYWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICB0aGlzLiRlbWl0KCd1cGRhdGU6bW9kZWxWYWx1ZScsIHZhbHVlLCBldmVudClcbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgdGhpcy4kZW1pdCgnZWRpdG9yRGlkTW91bnQnLCB0aGlzLmVkaXRvcilcbiAgICB9LFxuXG4gICAgLyoqIEBkZXByZWNhdGVkICovXG4gICAgZ2V0TW9uYWNvKCkge1xuICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yXG4gICAgfSxcblxuICAgIGdldEVkaXRvcigpIHtcbiAgICAgIHJldHVybiB0aGlzLmVkaXRvclxuICAgIH0sXG5cbiAgICBnZXRNb2RpZmllZEVkaXRvcigpIHtcbiAgICAgIHJldHVybiB0aGlzLmRpZmZFZGl0b3IgPyB0aGlzLmVkaXRvci5nZXRNb2RpZmllZEVkaXRvcigpIDogdGhpcy5lZGl0b3JcbiAgICB9LFxuXG4gICAgZ2V0T3JpZ2luYWxFZGl0b3IoKSB7XG4gICAgICByZXR1cm4gdGhpcy5kaWZmRWRpdG9yID8gdGhpcy5lZGl0b3IuZ2V0T3JpZ2luYWxFZGl0b3IoKSA6IHRoaXMuZWRpdG9yXG4gICAgfSxcblxuICAgIGZvY3VzKCkge1xuICAgICAgdGhpcy5lZGl0b3IuZm9jdXMoKVxuICAgIH0sXG4gIH0sXG59XG48L3NjcmlwdD5cblxuPHRlbXBsYXRlPlxuICA8ZGl2IHJlZj1cInJvb3RcIiAvPlxuPC90ZW1wbGF0ZT5cbiIsImltcG9ydCB7IHJlbmRlciB9IGZyb20gXCIuL0NvZGVFZGl0b3IudnVlP3Z1ZSZ0eXBlPXRlbXBsYXRlJmlkPTZmZTZmNmM4XCJcbmltcG9ydCBzY3JpcHQgZnJvbSBcIi4vQ29kZUVkaXRvci52dWU/dnVlJnR5cGU9c2NyaXB0Jmxhbmc9anNcIlxuZXhwb3J0ICogZnJvbSBcIi4vQ29kZUVkaXRvci52dWU/dnVlJnR5cGU9c2NyaXB0Jmxhbmc9anNcIlxuXG5pbXBvcnQgZXhwb3J0Q29tcG9uZW50IGZyb20gXCIuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9kaXN0L2V4cG9ydEhlbHBlci5qc1wiXG5jb25zdCBfX2V4cG9ydHNfXyA9IC8qI19fUFVSRV9fKi9leHBvcnRDb21wb25lbnQoc2NyaXB0LCBbWydyZW5kZXInLHJlbmRlcl0sWydfX2ZpbGUnLFwiYXBwLWZyb250ZW5kL3NyYy9mZWF0dXJlcy9jb2RlL0NvZGVFZGl0b3IudnVlXCJdXSlcbi8qIGhvdCByZWxvYWQgKi9cbmlmIChtb2R1bGUuaG90KSB7XG4gIF9fZXhwb3J0c19fLl9faG1ySWQgPSBcIjZmZTZmNmM4XCJcbiAgY29uc3QgYXBpID0gX19WVUVfSE1SX1JVTlRJTUVfX1xuICBtb2R1bGUuaG90LmFjY2VwdCgpXG4gIGlmICghYXBpLmNyZWF0ZVJlY29yZCgnNmZlNmY2YzgnLCBfX2V4cG9ydHNfXykpIHtcbiAgICBhcGkucmVsb2FkKCc2ZmU2ZjZjOCcsIF9fZXhwb3J0c19fKVxuICB9XG4gIFxuICBtb2R1bGUuaG90LmFjY2VwdChcIi4vQ29kZUVkaXRvci52dWU/dnVlJnR5cGU9dGVtcGxhdGUmaWQ9NmZlNmY2YzhcIiwgKCkgPT4ge1xuICAgIGFwaS5yZXJlbmRlcignNmZlNmY2YzgnLCByZW5kZXIpXG4gIH0pXG5cbn1cblxuXG5leHBvcnQgZGVmYXVsdCBfX2V4cG9ydHNfXyIsImV4cG9ydCB7IGRlZmF1bHQgfSBmcm9tIFwiLSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvYmFiZWwtbG9hZGVyL2xpYi9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9kaXN0L2luZGV4LmpzPz9ydWxlU2V0WzBdIS4vQ29kZUVkaXRvci52dWU/dnVlJnR5cGU9c2NyaXB0Jmxhbmc9anNcIjsgZXhwb3J0ICogZnJvbSBcIi0hLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL2JhYmVsLWxvYWRlci9saWIvaW5kZXguanMhLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3Z1ZS1sb2FkZXIvZGlzdC9pbmRleC5qcz8/cnVsZVNldFswXSEuL0NvZGVFZGl0b3IudnVlP3Z1ZSZ0eXBlPXNjcmlwdCZsYW5nPWpzXCIiLCJleHBvcnQgKiBmcm9tIFwiLSEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvYmFiZWwtbG9hZGVyL2xpYi9pbmRleC5qcyEuLi8uLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvdnVlLWxvYWRlci9kaXN0L3RlbXBsYXRlTG9hZGVyLmpzPz9ydWxlU2V0WzFdLnJ1bGVzWzNdIS4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy92dWUtbG9hZGVyL2Rpc3QvaW5kZXguanM/P3J1bGVTZXRbMF0hLi9Db2RlRWRpdG9yLnZ1ZT92dWUmdHlwZT10ZW1wbGF0ZSZpZD02ZmU2ZjZjOFwiIl0sIm5hbWVzIjpbIm1vbmFjbyIsImFzc2lnbiIsImVkaXRvciIsImRlZmluZVRoZW1lIiwicmVxdWlyZSIsIm5hbWUiLCJwcm9wcyIsIm9yaWdpbmFsIiwidHlwZSIsIlN0cmluZyIsImRlZmF1bHQiLCJtb2RlbFZhbHVlIiwicmVxdWlyZWQiLCJ0aGVtZSIsImxhbmd1YWdlIiwib3B0aW9ucyIsIk9iamVjdCIsImRpZmZFZGl0b3IiLCJCb29sZWFuIiwiZW1pdHMiLCJ3YXRjaCIsImRlZXAiLCJoYW5kbGVyIiwiZ2V0TW9kaWZpZWRFZGl0b3IiLCJ1cGRhdGVPcHRpb25zIiwibmV3VmFsdWUiLCJnZXRWYWx1ZSIsInNldFZhbHVlIiwiZ2V0T3JpZ2luYWxFZGl0b3IiLCJuZXdWYWwiLCJzZXRNb2RlbExhbmd1YWdlIiwiZ2V0TW9kZWwiLCJzZXRUaGVtZSIsIm1vdW50ZWQiLCIkbmV4dFRpY2siLCJpbml0TW9uYWNvIiwiYmVmb3JlVW5tb3VudCIsImRpc3Bvc2UiLCJtZXRob2RzIiwiJGVtaXQiLCJ2YWx1ZSIsInJvb3QiLCIkcmVmcyIsImNyZWF0ZURpZmZFZGl0b3IiLCJvcmlnaW5hbE1vZGVsIiwiY3JlYXRlTW9kZWwiLCJtb2RpZmllZE1vZGVsIiwic2V0TW9kZWwiLCJtb2RpZmllZCIsImNyZWF0ZSIsIm9uRGlkQ2hhbmdlTW9kZWxDb250ZW50IiwiZXZlbnQiLCJnZXRNb25hY28iLCJnZXRFZGl0b3IiLCJmb2N1cyIsInJlZiIsIl9jcmVhdGVFbGVtZW50QmxvY2siXSwic291cmNlUm9vdCI6IiJ9