var _classPrivateFieldLooseBase2 = (() => {
	var s = {
		classPrivateFieldLooseBase: function(e, r) {
			function i(a, l) {
				if (!{}.hasOwnProperty.call(a, l)) throw new TypeError("attempted to use private field on non-instance");
				return a;
			}
			e.exports = i, e.exports.__esModule = !0, e.exports.default = e.exports;
		},
		classPrivateFieldLooseKey: function(e, r) {
			var i = 0;
			function a(l) {
				return "__private_" + i++ + "_" + l;
			}
			e.exports = a, e.exports.__esModule = !0, e.exports.default = e.exports;
		}
	}, o = {};
	function t(e) {
		if (o[e]) return o[e].exports;
		var r = o[e] = { exports: {} };
		return s[e](r, t), r.exports;
	}
	return {
		classPrivateFieldLooseBase: t("classPrivateFieldLooseBase"),
		classPrivateFieldLooseKey: t("classPrivateFieldLooseKey")
	};
})();
function _classPrivateFieldLooseBase(s, o, t) {
	return t && s == null ? s : _classPrivateFieldLooseBase2.classPrivateFieldLooseBase(s, o);
}
var _construct2 = (() => {
	var p = {
		isNativeReflectConstruct: function(e, r) {
			function t() {
				try {
					var n = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
				} catch (c) {}
				return (e.exports = t = function() {
					return !!n;
				}, e.exports.__esModule = !0, e.exports.default = e.exports)();
			}
			e.exports = t, e.exports.__esModule = !0, e.exports.default = e.exports;
		},
		setPrototypeOf: function(e, r) {
			function t(n, c) {
				return e.exports = t = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(s, f) {
					return s.__proto__ = f, s;
				}, e.exports.__esModule = !0, e.exports.default = e.exports, t(n, c);
			}
			e.exports = t, e.exports.__esModule = !0, e.exports.default = e.exports;
		},
		construct: function(e, r) {
			var t = r("isNativeReflectConstruct"), n = r("setPrototypeOf");
			function c(s, f, x) {
				if (t()) return Reflect.construct.apply(null, arguments);
				var l = [null];
				l.push.apply(l, f);
				var a = new (s.bind.apply(s, l))();
				return x && n(a, x.prototype), a;
			}
			e.exports = c, e.exports.__esModule = !0, e.exports.default = e.exports;
		}
	}, o = {};
	function u(e) {
		if (o[e]) return o[e].exports;
		var r = o[e] = { exports: {} };
		return p[e](r, u), r.exports;
	}
	return { construct: u("construct") };
})();
function _construct(p, o, u) {
	return _construct2.construct(p, o, u);
}
class Base {}
var Observer = ((__nox_super_29_159) => {
	"use strict";
	var _read = _classPrivateFieldLooseBase2.classPrivateFieldLooseKey("__private__Class_read");
	var _result = _classPrivateFieldLooseBase2.classPrivateFieldLooseKey("__private__Class_result");
	var _privateMethod = function() {
		if (new.target) throw new TypeError("Class methods cannot be invoked with 'new'");
		return _classPrivateFieldLooseBase(this, _result)[_result];
	};
	function _initialize() {
		Object.defineProperty(this, _read, { value: _privateMethod });
		Object.defineProperty(this, _result, {
			writable: true,
			value: void 0
		});
	}
	const _Class = function _Class() {
		if (!new.target) throw new TypeError("Cannot call a class as a function");
		var _this = _construct(Object.getPrototypeOf(_Class), [], new.target || _Class);
		(function() {
			_initialize.call(this);
		}).call(_this);
		var _result = (function() {
			_classPrivateFieldLooseBase(this, _result)[_result] = [];
		}).apply(_this, arguments);
		if (_result !== void 0) {
			if (typeof _result === "object" && _result !== null || typeof _result === "function") return _result;
			throw new TypeError("Derived constructors may only return object or undefined");
		}
		return _this;
	};
	Object.defineProperty(_Class, "name", {
		value: "Observer",
		configurable: true
	});
	if (__nox_super_29_159 !== null && typeof __nox_super_29_159 !== "function") throw new TypeError("Super expression must either be null or a function");
	_Class.prototype = Object.create(__nox_super_29_159 && __nox_super_29_159.prototype, { constructor: {
		value: _Class,
		writable: true,
		configurable: true
	} });
	if (Object.setPrototypeOf) Object.setPrototypeOf(_Class, __nox_super_29_159);
	else _Class.__proto__ = __nox_super_29_159;
	Object.defineProperty(_Class.prototype, "read", {
		value: Object.defineProperty(function() {
			if (new.target) throw new TypeError("Class methods cannot be invoked with 'new'");
			return _classPrivateFieldLooseBase(this, _read)[_read]();
		}, "name", {
			value: "read",
			configurable: true
		}),
		writable: true,
		configurable: true
	});
	Object.defineProperty(_Class, "prototype", { writable: false });
	return _Class;
})(Base);
globalThis.observed = new Observer().read();
