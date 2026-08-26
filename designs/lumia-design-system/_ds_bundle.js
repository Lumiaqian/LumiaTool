/* @ds-bundle: {"format":3,"namespace":"LumiaDesignSystem_f7d94a","components":[{"name":"Button","sourcePath":"components/Button/Button.jsx"},{"name":"Panel","sourcePath":"components/Panel/Panel.jsx"},{"name":"ResultRow","sourcePath":"components/ResultRow/ResultRow.jsx"}],"sourceHashes":{"components/Button/Button.jsx":"497254b2c62f","components/Panel/Panel.jsx":"c2f7adba0fcb","components/ResultRow/ResultRow.jsx":"ac1104475c77"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.LumiaDesignSystem_f7d94a = window.LumiaDesignSystem_f7d94a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/Button/Button.jsx
try { (() => {
function Button({
  variant = "secondary",
  disabled = false,
  children,
  onClick,
  ariaLabel
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: "lumia-button",
    "data-variant": variant,
    disabled: disabled,
    "aria-label": ariaLabel,
    onClick: onClick
  }, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Button/Button.jsx", error: String((e && e.message) || e) }); }

// components/Panel/Panel.jsx
try { (() => {
function Panel({
  title,
  surface = "paper",
  actions,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "lumia-panel",
    "data-surface": surface
  }, /*#__PURE__*/React.createElement("header", {
    className: "lumia-panel__header"
  }, /*#__PURE__*/React.createElement("strong", null, title), /*#__PURE__*/React.createElement("span", null, actions)), /*#__PURE__*/React.createElement("div", {
    className: "lumia-panel__body"
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/Panel/Panel.jsx", error: String((e && e.message) || e) }); }

// components/ResultRow/ResultRow.jsx
try { (() => {
function ResultRow({
  label,
  value = "",
  state = "default",
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "lumia-result-row",
    "data-state": state
  }, /*#__PURE__*/React.createElement("span", {
    className: "lumia-result-row__label"
  }, label), /*#__PURE__*/React.createElement("output", {
    className: "lumia-result-row__value"
  }, value || "—"), value && action ? /*#__PURE__*/React.createElement("span", null, action) : null);
}
Object.assign(__ds_scope, { ResultRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ResultRow/ResultRow.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.ResultRow = __ds_scope.ResultRow;

})();
