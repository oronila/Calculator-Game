
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.47.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function backOut(t) {
        const s = 1.70158;
        return --t * t * ((s + 1) * t + s) + 1;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* src/Ripple.svelte generated by Svelte v3.47.0 */
    const file$2 = "src/Ripple.svelte";

    function create_fragment$2(ctx) {
    	let defs;
    	let filter;
    	let feGaussianBlur;
    	let t;
    	let circle;

    	const block = {
    		c: function create() {
    			defs = svg_element("defs");
    			filter = svg_element("filter");
    			feGaussianBlur = svg_element("feGaussianBlur");
    			t = space();
    			circle = svg_element("circle");
    			attr_dev(feGaussianBlur, "in", "SourceGraphic");
    			attr_dev(feGaussianBlur, "stdDeviation", /*rippleBlur*/ ctx[2]);
    			add_location(feGaussianBlur, file$2, 16, 2, 448);
    			attr_dev(filter, "id", "f1");
    			attr_dev(filter, "x", "0");
    			attr_dev(filter, "y", "0");
    			add_location(filter, file$2, 15, 1, 417);
    			add_location(defs, file$2, 14, 0, 409);
    			attr_dev(circle, "cx", /*x*/ ctx[0]);
    			attr_dev(circle, "cy", /*y*/ ctx[1]);
    			attr_dev(circle, "r", /*$rippleSize*/ ctx[3]);
    			attr_dev(circle, "opacity", /*$rippleOpacity*/ ctx[4]);
    			attr_dev(circle, "filter", "url(#f1)");
    			attr_dev(circle, "class", "svelte-1n4r1uq");
    			add_location(circle, file$2, 19, 0, 531);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, defs, anchor);
    			append_dev(defs, filter);
    			append_dev(filter, feGaussianBlur);
    			insert_dev(target, t, anchor);
    			insert_dev(target, circle, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rippleBlur*/ 4) {
    				attr_dev(feGaussianBlur, "stdDeviation", /*rippleBlur*/ ctx[2]);
    			}

    			if (dirty & /*x*/ 1) {
    				attr_dev(circle, "cx", /*x*/ ctx[0]);
    			}

    			if (dirty & /*y*/ 2) {
    				attr_dev(circle, "cy", /*y*/ ctx[1]);
    			}

    			if (dirty & /*$rippleSize*/ 8) {
    				attr_dev(circle, "r", /*$rippleSize*/ ctx[3]);
    			}

    			if (dirty & /*$rippleOpacity*/ 16) {
    				attr_dev(circle, "opacity", /*$rippleOpacity*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(defs);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(circle);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $rippleSize;
    	let $rippleOpacity;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ripple', slots, []);
    	let { x, y, sizeIn, size, speed, rippleBlur, opacityIn } = $$props;

    	onMount(() => {
    		rippleOpacity.set(0);
    		rippleSize.set(size);
    	});

    	const rippleSize = tweened(sizeIn, { duration: speed }),
    		rippleOpacity = tweened(opacityIn, {
    			duration: speed + speed * 2.5,
    			easing: backOut
    		});

    	validate_store(rippleSize, 'rippleSize');
    	component_subscribe($$self, rippleSize, value => $$invalidate(3, $rippleSize = value));
    	validate_store(rippleOpacity, 'rippleOpacity');
    	component_subscribe($$self, rippleOpacity, value => $$invalidate(4, $rippleOpacity = value));
    	const writable_props = ['x', 'y', 'sizeIn', 'size', 'speed', 'rippleBlur', 'opacityIn'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ripple> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    		if ('sizeIn' in $$props) $$invalidate(7, sizeIn = $$props.sizeIn);
    		if ('size' in $$props) $$invalidate(8, size = $$props.size);
    		if ('speed' in $$props) $$invalidate(9, speed = $$props.speed);
    		if ('rippleBlur' in $$props) $$invalidate(2, rippleBlur = $$props.rippleBlur);
    		if ('opacityIn' in $$props) $$invalidate(10, opacityIn = $$props.opacityIn);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		tweened,
    		backOut,
    		x,
    		y,
    		sizeIn,
    		size,
    		speed,
    		rippleBlur,
    		opacityIn,
    		rippleSize,
    		rippleOpacity,
    		$rippleSize,
    		$rippleOpacity
    	});

    	$$self.$inject_state = $$props => {
    		if ('x' in $$props) $$invalidate(0, x = $$props.x);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    		if ('sizeIn' in $$props) $$invalidate(7, sizeIn = $$props.sizeIn);
    		if ('size' in $$props) $$invalidate(8, size = $$props.size);
    		if ('speed' in $$props) $$invalidate(9, speed = $$props.speed);
    		if ('rippleBlur' in $$props) $$invalidate(2, rippleBlur = $$props.rippleBlur);
    		if ('opacityIn' in $$props) $$invalidate(10, opacityIn = $$props.opacityIn);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		x,
    		y,
    		rippleBlur,
    		$rippleSize,
    		$rippleOpacity,
    		rippleSize,
    		rippleOpacity,
    		sizeIn,
    		size,
    		speed,
    		opacityIn
    	];
    }

    class Ripple extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			x: 0,
    			y: 1,
    			sizeIn: 7,
    			size: 8,
    			speed: 9,
    			rippleBlur: 2,
    			opacityIn: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ripple",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*x*/ ctx[0] === undefined && !('x' in props)) {
    			console.warn("<Ripple> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[1] === undefined && !('y' in props)) {
    			console.warn("<Ripple> was created without expected prop 'y'");
    		}

    		if (/*sizeIn*/ ctx[7] === undefined && !('sizeIn' in props)) {
    			console.warn("<Ripple> was created without expected prop 'sizeIn'");
    		}

    		if (/*size*/ ctx[8] === undefined && !('size' in props)) {
    			console.warn("<Ripple> was created without expected prop 'size'");
    		}

    		if (/*speed*/ ctx[9] === undefined && !('speed' in props)) {
    			console.warn("<Ripple> was created without expected prop 'speed'");
    		}

    		if (/*rippleBlur*/ ctx[2] === undefined && !('rippleBlur' in props)) {
    			console.warn("<Ripple> was created without expected prop 'rippleBlur'");
    		}

    		if (/*opacityIn*/ ctx[10] === undefined && !('opacityIn' in props)) {
    			console.warn("<Ripple> was created without expected prop 'opacityIn'");
    		}
    	}

    	get x() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sizeIn() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sizeIn(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get speed() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set speed(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rippleBlur() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rippleBlur(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get opacityIn() {
    		throw new Error("<Ripple>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opacityIn(value) {
    		throw new Error("<Ripple>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Button.svelte generated by Svelte v3.47.0 */
    const file$1 = "src/Button.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[45] = list[i];
    	child_ctx[47] = i;
    	return child_ctx;
    }

    // (105:2) {#each $ripples as ripple, index}
    function create_each_block(ctx) {
    	let ripple;
    	let current;

    	ripple = new Ripple({
    			props: {
    				x: /*ripple*/ ctx[45].x,
    				y: /*ripple*/ ctx[45].y,
    				size: /*ripple*/ ctx[45].size,
    				speed: /*speed*/ ctx[1],
    				sizeIn: /*sizeIn*/ ctx[11],
    				opacityIn: /*opacityIn*/ ctx[12],
    				rippleBlur: /*rippleBlur*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(ripple.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(ripple, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const ripple_changes = {};
    			if (dirty[0] & /*$ripples*/ 262144) ripple_changes.x = /*ripple*/ ctx[45].x;
    			if (dirty[0] & /*$ripples*/ 262144) ripple_changes.y = /*ripple*/ ctx[45].y;
    			if (dirty[0] & /*$ripples*/ 262144) ripple_changes.size = /*ripple*/ ctx[45].size;
    			if (dirty[0] & /*speed*/ 2) ripple_changes.speed = /*speed*/ ctx[1];
    			if (dirty[0] & /*sizeIn*/ 2048) ripple_changes.sizeIn = /*sizeIn*/ ctx[11];
    			if (dirty[0] & /*opacityIn*/ 4096) ripple_changes.opacityIn = /*opacityIn*/ ctx[12];
    			if (dirty[0] & /*rippleBlur*/ 1) ripple_changes.rippleBlur = /*rippleBlur*/ ctx[0];
    			ripple.$set(ripple_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ripple.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ripple.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ripple, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(105:2) {#each $ripples as ripple, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let button;
    	let span;
    	let t;
    	let svg;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[28].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[27], null);
    	let each_value = /*$ripples*/ ctx[18];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t = space();
    			svg = svg_element("svg");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "svelte-1pex0sn");
    			add_location(span, file$1, 100, 1, 2850);
    			attr_dev(svg, "class", "svelte-1pex0sn");
    			add_location(svg, file$1, 103, 1, 2884);
    			set_style(button, "--color", /*color*/ ctx[2]);
    			set_style(button, "--font-size", /*fontSize*/ ctx[3]);
    			set_style(button, "--bg-color", /*bgColor*/ ctx[4]);
    			set_style(button, "--bg-hover", /*bgHover*/ ctx[5]);
    			set_style(button, "--bg-active", /*bgActive*/ ctx[6]);
    			set_style(button, "--radius", /*round*/ ctx[8]);
    			set_style(button, "--ripple", /*rippleColor*/ ctx[7]);
    			set_style(button, "--height", /*height*/ ctx[9] + "px");
    			set_style(button, "--width", /*width*/ ctx[10] + "px");
    			set_style(button, "--shadow", /*shadows*/ ctx[19][/*shadow*/ ctx[13]]);
    			set_style(button, "--shadow-h", /*shadows*/ ctx[19][/*shadowHover*/ ctx[14]]);
    			set_style(button, "--shadow-a", /*shadows*/ ctx[19][/*shadowActive*/ ctx[15]]);
    			attr_dev(button, "class", "svelte-1pex0sn");
    			add_location(button, file$1, 99, 0, 2419);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(button, t);
    			append_dev(button, svg);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svg, null);
    			}

    			/*button_binding*/ ctx[29](button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "touchstart", /*touchstart_handler*/ ctx[30], false, false, false),
    					listen_dev(button, "mousedown", /*mousedown_handler*/ ctx[31], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*$$scope*/ 134217728)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[27],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[27])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[27], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty[0] & /*$ripples, speed, sizeIn, opacityIn, rippleBlur*/ 268291) {
    				each_value = /*$ripples*/ ctx[18];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(svg, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty[0] & /*color*/ 4) {
    				set_style(button, "--color", /*color*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*fontSize*/ 8) {
    				set_style(button, "--font-size", /*fontSize*/ ctx[3]);
    			}

    			if (!current || dirty[0] & /*bgColor*/ 16) {
    				set_style(button, "--bg-color", /*bgColor*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*bgHover*/ 32) {
    				set_style(button, "--bg-hover", /*bgHover*/ ctx[5]);
    			}

    			if (!current || dirty[0] & /*bgActive*/ 64) {
    				set_style(button, "--bg-active", /*bgActive*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*round*/ 256) {
    				set_style(button, "--radius", /*round*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*rippleColor*/ 128) {
    				set_style(button, "--ripple", /*rippleColor*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*height*/ 512) {
    				set_style(button, "--height", /*height*/ ctx[9] + "px");
    			}

    			if (!current || dirty[0] & /*width*/ 1024) {
    				set_style(button, "--width", /*width*/ ctx[10] + "px");
    			}

    			if (!current || dirty[0] & /*shadow*/ 8192) {
    				set_style(button, "--shadow", /*shadows*/ ctx[19][/*shadow*/ ctx[13]]);
    			}

    			if (!current || dirty[0] & /*shadowHover*/ 16384) {
    				set_style(button, "--shadow-h", /*shadows*/ ctx[19][/*shadowHover*/ ctx[14]]);
    			}

    			if (!current || dirty[0] & /*shadowActive*/ 32768) {
    				set_style(button, "--shadow-a", /*shadows*/ ctx[19][/*shadowActive*/ ctx[15]]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			destroy_each(each_blocks, detaching);
    			/*button_binding*/ ctx[29](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $ripples,
    		$$unsubscribe_ripples = noop,
    		$$subscribe_ripples = () => ($$unsubscribe_ripples(), $$unsubscribe_ripples = subscribe(ripples, $$value => $$invalidate(18, $ripples = $$value)), ripples);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_ripples());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let { rippleBlur = 2, speed = 500, color = '#fff', fontSize = '3rem', bgColor = '93, 120, 255', bgHover = bgColor, bgActive = bgColor, rippleColor = '#264169', round = '0.5rem', height = 150, width = 150, sizeIn = 20, opacityIn = 0.2, shadow = 'none', shadowHover = 'none', shadowActive = 'none' } = $$props;

    	let shadows = {
    			none: 'none',
    			1: '0 0 0 1px rgba(0, 0, 0, 0.05)',
    			2: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    			3: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    			4: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    			5: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    			6: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    			7: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
    		},
    		mouseX,
    		mouseY;

    	function handleRipple() {
    		const ripples = writable([]);

    		return {
    			subscribe: ripples.subscribe,
    			add: item => {
    				ripples.update(items => {
    					return [...items, item];
    				});
    			},
    			clear: () => {
    				ripples.update(items => {
    					return [];
    				});
    			}
    		};
    	}

    	const ripples = handleRipple();
    	validate_store(ripples, 'ripples');
    	$$subscribe_ripples();

    	let rect,
    		rippleBtn,
    		w,
    		h,
    		x,
    		y,
    		offsetX,
    		offsetY,
    		deltaX,
    		deltaY,
    		locationY,
    		locationX,
    		scale_ratio,
    		timer;

    	let coords = { x: 50, y: 50 };

    	const debounce = () => {
    		clearTimeout(timer);

    		timer = setTimeout(
    			() => {
    				ripples.clear();
    			},
    			speed + speed * 2
    		);
    	};

    	let touch;

    	function handleClick(e, type) {
    		if (type == 'touch') {
    			touch = true;

    			ripples.add({
    				x: e.pageX - locationX,
    				y: e.pageY - locationY,
    				size: scale_ratio
    			});
    		} else {
    			if (!touch) {
    				ripples.add({
    					x: e.clientX - locationX,
    					y: e.clientY - locationY,
    					size: scale_ratio
    				});
    			}

    			touch = false;
    		}

    		debounce();
    	}

    	onMount(() => {
    		$$invalidate(21, w = rippleBtn.offsetWidth);
    		$$invalidate(22, h = rippleBtn.offsetHeight);
    		rect = rippleBtn.getBoundingClientRect();
    		locationY = rect.y;
    		locationX = rect.x;
    	});

    	const writable_props = [
    		'rippleBlur',
    		'speed',
    		'color',
    		'fontSize',
    		'bgColor',
    		'bgHover',
    		'bgActive',
    		'rippleColor',
    		'round',
    		'height',
    		'width',
    		'sizeIn',
    		'opacityIn',
    		'shadow',
    		'shadowHover',
    		'shadowActive'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	function button_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			rippleBtn = $$value;
    			$$invalidate(17, rippleBtn);
    		});
    	}

    	const touchstart_handler = e => handleClick(e.touches[0], 'touch');
    	const mousedown_handler = e => handleClick(e, 'click');

    	$$self.$$set = $$props => {
    		if ('rippleBlur' in $$props) $$invalidate(0, rippleBlur = $$props.rippleBlur);
    		if ('speed' in $$props) $$invalidate(1, speed = $$props.speed);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('fontSize' in $$props) $$invalidate(3, fontSize = $$props.fontSize);
    		if ('bgColor' in $$props) $$invalidate(4, bgColor = $$props.bgColor);
    		if ('bgHover' in $$props) $$invalidate(5, bgHover = $$props.bgHover);
    		if ('bgActive' in $$props) $$invalidate(6, bgActive = $$props.bgActive);
    		if ('rippleColor' in $$props) $$invalidate(7, rippleColor = $$props.rippleColor);
    		if ('round' in $$props) $$invalidate(8, round = $$props.round);
    		if ('height' in $$props) $$invalidate(9, height = $$props.height);
    		if ('width' in $$props) $$invalidate(10, width = $$props.width);
    		if ('sizeIn' in $$props) $$invalidate(11, sizeIn = $$props.sizeIn);
    		if ('opacityIn' in $$props) $$invalidate(12, opacityIn = $$props.opacityIn);
    		if ('shadow' in $$props) $$invalidate(13, shadow = $$props.shadow);
    		if ('shadowHover' in $$props) $$invalidate(14, shadowHover = $$props.shadowHover);
    		if ('shadowActive' in $$props) $$invalidate(15, shadowActive = $$props.shadowActive);
    		if ('$$scope' in $$props) $$invalidate(27, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		tweened,
    		Ripple,
    		writable,
    		rippleBlur,
    		speed,
    		color,
    		fontSize,
    		bgColor,
    		bgHover,
    		bgActive,
    		rippleColor,
    		round,
    		height,
    		width,
    		sizeIn,
    		opacityIn,
    		shadow,
    		shadowHover,
    		shadowActive,
    		shadows,
    		mouseX,
    		mouseY,
    		handleRipple,
    		ripples,
    		rect,
    		rippleBtn,
    		w,
    		h,
    		x,
    		y,
    		offsetX,
    		offsetY,
    		deltaX,
    		deltaY,
    		locationY,
    		locationX,
    		scale_ratio,
    		timer,
    		coords,
    		debounce,
    		touch,
    		handleClick,
    		$ripples
    	});

    	$$self.$inject_state = $$props => {
    		if ('rippleBlur' in $$props) $$invalidate(0, rippleBlur = $$props.rippleBlur);
    		if ('speed' in $$props) $$invalidate(1, speed = $$props.speed);
    		if ('color' in $$props) $$invalidate(2, color = $$props.color);
    		if ('fontSize' in $$props) $$invalidate(3, fontSize = $$props.fontSize);
    		if ('bgColor' in $$props) $$invalidate(4, bgColor = $$props.bgColor);
    		if ('bgHover' in $$props) $$invalidate(5, bgHover = $$props.bgHover);
    		if ('bgActive' in $$props) $$invalidate(6, bgActive = $$props.bgActive);
    		if ('rippleColor' in $$props) $$invalidate(7, rippleColor = $$props.rippleColor);
    		if ('round' in $$props) $$invalidate(8, round = $$props.round);
    		if ('height' in $$props) $$invalidate(9, height = $$props.height);
    		if ('width' in $$props) $$invalidate(10, width = $$props.width);
    		if ('sizeIn' in $$props) $$invalidate(11, sizeIn = $$props.sizeIn);
    		if ('opacityIn' in $$props) $$invalidate(12, opacityIn = $$props.opacityIn);
    		if ('shadow' in $$props) $$invalidate(13, shadow = $$props.shadow);
    		if ('shadowHover' in $$props) $$invalidate(14, shadowHover = $$props.shadowHover);
    		if ('shadowActive' in $$props) $$invalidate(15, shadowActive = $$props.shadowActive);
    		if ('shadows' in $$props) $$invalidate(19, shadows = $$props.shadows);
    		if ('mouseX' in $$props) mouseX = $$props.mouseX;
    		if ('mouseY' in $$props) mouseY = $$props.mouseY;
    		if ('rect' in $$props) rect = $$props.rect;
    		if ('rippleBtn' in $$props) $$invalidate(17, rippleBtn = $$props.rippleBtn);
    		if ('w' in $$props) $$invalidate(21, w = $$props.w);
    		if ('h' in $$props) $$invalidate(22, h = $$props.h);
    		if ('x' in $$props) x = $$props.x;
    		if ('y' in $$props) y = $$props.y;
    		if ('offsetX' in $$props) $$invalidate(23, offsetX = $$props.offsetX);
    		if ('offsetY' in $$props) $$invalidate(24, offsetY = $$props.offsetY);
    		if ('deltaX' in $$props) $$invalidate(25, deltaX = $$props.deltaX);
    		if ('deltaY' in $$props) $$invalidate(26, deltaY = $$props.deltaY);
    		if ('locationY' in $$props) locationY = $$props.locationY;
    		if ('locationX' in $$props) locationX = $$props.locationX;
    		if ('scale_ratio' in $$props) scale_ratio = $$props.scale_ratio;
    		if ('timer' in $$props) timer = $$props.timer;
    		if ('coords' in $$props) $$invalidate(43, coords = $$props.coords);
    		if ('touch' in $$props) touch = $$props.touch;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*w, h, offsetX, offsetY, deltaX, deltaY*/ 132120576) {
    			($$invalidate(23, offsetX = Math.abs(w / 2 - coords.x)), $$invalidate(24, offsetY = Math.abs(h / 2 - coords.y)), $$invalidate(25, deltaX = w / 2 + offsetX), $$invalidate(26, deltaY = h / 2 + offsetY), scale_ratio = Math.sqrt(Math.pow(deltaX, 2.2) + Math.pow(deltaY, 2.2)));
    		}
    	};

    	return [
    		rippleBlur,
    		speed,
    		color,
    		fontSize,
    		bgColor,
    		bgHover,
    		bgActive,
    		rippleColor,
    		round,
    		height,
    		width,
    		sizeIn,
    		opacityIn,
    		shadow,
    		shadowHover,
    		shadowActive,
    		ripples,
    		rippleBtn,
    		$ripples,
    		shadows,
    		handleClick,
    		w,
    		h,
    		offsetX,
    		offsetY,
    		deltaX,
    		deltaY,
    		$$scope,
    		slots,
    		button_binding,
    		touchstart_handler,
    		mousedown_handler
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$1,
    			create_fragment$1,
    			safe_not_equal,
    			{
    				rippleBlur: 0,
    				speed: 1,
    				color: 2,
    				fontSize: 3,
    				bgColor: 4,
    				bgHover: 5,
    				bgActive: 6,
    				rippleColor: 7,
    				round: 8,
    				height: 9,
    				width: 10,
    				sizeIn: 11,
    				opacityIn: 12,
    				shadow: 13,
    				shadowHover: 14,
    				shadowActive: 15,
    				ripples: 16
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get rippleBlur() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rippleBlur(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get speed() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set speed(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fontSize() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fontSize(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgColor() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgColor(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgHover() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgHover(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bgActive() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bgActive(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rippleColor() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rippleColor(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get round() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set round(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sizeIn() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sizeIn(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get opacityIn() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opacityIn(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shadow() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shadow(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shadowHover() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shadowHover(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get shadowActive() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set shadowActive(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ripples() {
    		return this.$$.ctx[16];
    	}

    	set ripples(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.47.0 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (186:1) {#if visible}
    function create_if_block_1(ctx) {
    	let h1;
    	let h1_transition;
    	let t1;
    	let p;
    	let p_transition;
    	let current;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Calculator Game";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Press Any Button To Start...";
    			attr_dev(h1, "class", "svelte-v92wms");
    			add_location(h1, file, 186, 1, 3369);
    			attr_dev(p, "id", "titleInstruct");
    			attr_dev(p, "class", "svelte-v92wms");
    			add_location(p, file, 187, 1, 3430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!h1_transition) h1_transition = create_bidirectional_transition(h1, fade, { duration: 1500 }, true);
    				h1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { delay: 250, duration: 1500 }, true);
    				p_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!h1_transition) h1_transition = create_bidirectional_transition(h1, fade, { duration: 1500 }, false);
    			h1_transition.run(0);
    			if (!p_transition) p_transition = create_bidirectional_transition(p, fade, { delay: 250, duration: 1500 }, false);
    			p_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching && h1_transition) h1_transition.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching && p_transition) p_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(186:1) {#if visible}",
    		ctx
    	});

    	return block;
    }

    // (193:1) {#if !visible}
    function create_if_block(ctx) {
    	let div14;
    	let div0;
    	let h2;
    	let t0;
    	let t1;
    	let t2;
    	let p0;
    	let t3;
    	let t4;
    	let t5;
    	let p1;
    	let t6;
    	let t7;
    	let t8;
    	let p2;
    	let t9;
    	let t10;
    	let div13;
    	let div4;
    	let div1;
    	let button0;
    	let t11;
    	let div2;
    	let button1;
    	let t12;
    	let div3;
    	let button2;
    	let t13;
    	let div8;
    	let div5;
    	let button3;
    	let t14;
    	let div6;
    	let button4;
    	let t15;
    	let div7;
    	let button5;
    	let t16;
    	let div12;
    	let div9;
    	let button6;
    	let t17;
    	let div10;
    	let button7;
    	let t18;
    	let div11;
    	let button8;
    	let div14_intro;
    	let t19;
    	let div15;
    	let div15_intro;
    	let current;
    	let mounted;
    	let dispose;
    	button0 = new Button({ $$inline: true });

    	button1 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button2 = new Button({ $$inline: true });

    	button3 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button4 = new Button({
    			props: {
    				bgColor: "255, 0, 0",
    				rippleColor: "165, 0, 0",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button5 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button6 = new Button({ $$inline: true });

    	button7 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button8 = new Button({ $$inline: true });

    	const block = {
    		c: function create() {
    			div14 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text("Level: ");
    			t1 = text(/*level*/ ctx[6]);
    			t2 = space();
    			p0 = element("p");
    			t3 = text("Moves Left: ");
    			t4 = text(/*movesLeft*/ ctx[8]);
    			t5 = space();
    			p1 = element("p");
    			t6 = text("Goal: ");
    			t7 = text(/*goal*/ ctx[7]);
    			t8 = space();
    			p2 = element("p");
    			t9 = text(/*number*/ ctx[5]);
    			t10 = space();
    			div13 = element("div");
    			div4 = element("div");
    			div1 = element("div");
    			create_component(button0.$$.fragment);
    			t11 = space();
    			div2 = element("div");
    			create_component(button1.$$.fragment);
    			t12 = space();
    			div3 = element("div");
    			create_component(button2.$$.fragment);
    			t13 = space();
    			div8 = element("div");
    			div5 = element("div");
    			create_component(button3.$$.fragment);
    			t14 = space();
    			div6 = element("div");
    			create_component(button4.$$.fragment);
    			t15 = space();
    			div7 = element("div");
    			create_component(button5.$$.fragment);
    			t16 = space();
    			div12 = element("div");
    			div9 = element("div");
    			create_component(button6.$$.fragment);
    			t17 = space();
    			div10 = element("div");
    			create_component(button7.$$.fragment);
    			t18 = space();
    			div11 = element("div");
    			create_component(button8.$$.fragment);
    			t19 = space();
    			div15 = element("div");
    			attr_dev(h2, "id", "level");
    			attr_dev(h2, "class", "svelte-v92wms");
    			add_location(h2, file, 195, 3, 3669);
    			attr_dev(p0, "id", "moves");
    			attr_dev(p0, "class", "svelte-v92wms");
    			add_location(p0, file, 196, 3, 3707);
    			attr_dev(p1, "id", "goal");
    			attr_dev(p1, "class", "svelte-v92wms");
    			add_location(p1, file, 197, 3, 3752);
    			attr_dev(p2, "id", "number");
    			attr_dev(p2, "class", "svelte-v92wms");
    			add_location(p2, file, 198, 3, 3785);
    			attr_dev(div0, "class", "display-box svelte-v92wms");
    			add_location(div0, file, 194, 2, 3640);
    			attr_dev(div1, "class", "button svelte-v92wms");
    			add_location(div1, file, 202, 4, 3873);
    			attr_dev(div2, "class", "button svelte-v92wms");
    			attr_dev(div2, "id", "times2");
    			add_location(div2, file, 205, 4, 3932);
    			attr_dev(div3, "class", "button svelte-v92wms");
    			add_location(div3, file, 208, 4, 4043);
    			attr_dev(div4, "class", "col1");
    			add_location(div4, file, 201, 3, 3850);
    			attr_dev(div5, "class", "button svelte-v92wms");
    			add_location(div5, file, 214, 4, 4138);
    			attr_dev(div6, "class", "button svelte-v92wms");
    			attr_dev(div6, "id", "reset");
    			add_location(div6, file, 217, 4, 4253);
    			attr_dev(div7, "class", "button svelte-v92wms");
    			add_location(div7, file, 220, 4, 4389);
    			attr_dev(div8, "class", "col2");
    			add_location(div8, file, 213, 3, 4115);
    			attr_dev(div9, "class", "button svelte-v92wms");
    			add_location(div9, file, 225, 4, 4529);
    			attr_dev(div10, "class", "button svelte-v92wms");
    			add_location(div10, file, 228, 4, 4588);
    			attr_dev(div11, "class", "button svelte-v92wms");
    			add_location(div11, file, 231, 4, 4703);
    			attr_dev(div12, "class", "col3");
    			add_location(div12, file, 224, 3, 4506);
    			attr_dev(div13, "class", "buttons svelte-v92wms");
    			add_location(div13, file, 200, 2, 3824);
    			attr_dev(div14, "class", "calculator svelte-v92wms");
    			add_location(div14, file, 193, 1, 3573);
    			attr_dev(div15, "class", "instructions");
    			add_location(div15, file, 237, 1, 4786);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div14, anchor);
    			append_dev(div14, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(p1, t6);
    			append_dev(p1, t7);
    			append_dev(div0, t8);
    			append_dev(div0, p2);
    			append_dev(p2, t9);
    			append_dev(div14, t10);
    			append_dev(div14, div13);
    			append_dev(div13, div4);
    			append_dev(div4, div1);
    			mount_component(button0, div1, null);
    			append_dev(div4, t11);
    			append_dev(div4, div2);
    			mount_component(button1, div2, null);
    			append_dev(div4, t12);
    			append_dev(div4, div3);
    			mount_component(button2, div3, null);
    			append_dev(div13, t13);
    			append_dev(div13, div8);
    			append_dev(div8, div5);
    			mount_component(button3, div5, null);
    			append_dev(div8, t14);
    			append_dev(div8, div6);
    			mount_component(button4, div6, null);
    			append_dev(div8, t15);
    			append_dev(div8, div7);
    			mount_component(button5, div7, null);
    			append_dev(div13, t16);
    			append_dev(div13, div12);
    			append_dev(div12, div9);
    			mount_component(button6, div9, null);
    			append_dev(div12, t17);
    			append_dev(div12, div10);
    			mount_component(button7, div10, null);
    			append_dev(div12, t18);
    			append_dev(div12, div11);
    			mount_component(button8, div11, null);
    			insert_dev(target, t19, anchor);
    			insert_dev(target, div15, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(div5, "click", /*click_handler_1*/ ctx[15], false, false, false),
    					listen_dev(div6, "click", /*reset*/ ctx[9], false, false, false),
    					listen_dev(div7, "click", /*click_handler_2*/ ctx[16], false, false, false),
    					listen_dev(div10, "click", /*click_handler_3*/ ctx[17], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*level*/ 64) set_data_dev(t1, /*level*/ ctx[6]);
    			if (!current || dirty & /*movesLeft*/ 256) set_data_dev(t4, /*movesLeft*/ ctx[8]);
    			if (!current || dirty & /*goal*/ 128) set_data_dev(t7, /*goal*/ ctx[7]);
    			if (!current || dirty & /*number*/ 32) set_data_dev(t9, /*number*/ ctx[5]);
    			const button1_changes = {};

    			if (dirty & /*$$scope, addMove*/ 8388610) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    			const button3_changes = {};

    			if (dirty & /*$$scope, multiplyMove*/ 8388616) {
    				button3_changes.$$scope = { dirty, ctx };
    			}

    			button3.$set(button3_changes);
    			const button4_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				button4_changes.$$scope = { dirty, ctx };
    			}

    			button4.$set(button4_changes);
    			const button5_changes = {};

    			if (dirty & /*$$scope, divideMove*/ 8388624) {
    				button5_changes.$$scope = { dirty, ctx };
    			}

    			button5.$set(button5_changes);
    			const button7_changes = {};

    			if (dirty & /*$$scope, subtractMove*/ 8388612) {
    				button7_changes.$$scope = { dirty, ctx };
    			}

    			button7.$set(button7_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			transition_in(button4.$$.fragment, local);
    			transition_in(button5.$$.fragment, local);
    			transition_in(button6.$$.fragment, local);
    			transition_in(button7.$$.fragment, local);
    			transition_in(button8.$$.fragment, local);

    			if (!div14_intro) {
    				add_render_callback(() => {
    					div14_intro = create_in_transition(div14, fade, { delay: 1750, duration: 1000 });
    					div14_intro.start();
    				});
    			}

    			if (!div15_intro) {
    				add_render_callback(() => {
    					div15_intro = create_in_transition(div15, fade, { delay: 1750, duration: 1000 });
    					div15_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			transition_out(button4.$$.fragment, local);
    			transition_out(button5.$$.fragment, local);
    			transition_out(button6.$$.fragment, local);
    			transition_out(button7.$$.fragment, local);
    			transition_out(button8.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div14);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(button3);
    			destroy_component(button4);
    			destroy_component(button5);
    			destroy_component(button6);
    			destroy_component(button7);
    			destroy_component(button8);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(div15);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(193:1) {#if !visible}",
    		ctx
    	});

    	return block;
    }

    // (207:5) <Button>
    function create_default_slot_4(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("+");
    			t1 = text(/*addMove*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*addMove*/ 2) set_data_dev(t1, /*addMove*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(207:5) <Button>",
    		ctx
    	});

    	return block;
    }

    // (216:5) <Button>
    function create_default_slot_3(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("X");
    			t1 = text(/*multiplyMove*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*multiplyMove*/ 8) set_data_dev(t1, /*multiplyMove*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(216:5) <Button>",
    		ctx
    	});

    	return block;
    }

    // (219:5) <Button bgColor='255, 0, 0' rippleColor='165, 0, 0'>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Reset");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(219:5) <Button bgColor='255, 0, 0' rippleColor='165, 0, 0'>",
    		ctx
    	});

    	return block;
    }

    // (222:5) <Button>
    function create_default_slot_1(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("/");
    			t1 = text(/*divideMove*/ ctx[4]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*divideMove*/ 16) set_data_dev(t1, /*divideMove*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(222:5) <Button>",
    		ctx
    	});

    	return block;
    }

    // (230:5) <Button>
    function create_default_slot(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("-");
    			t1 = text(/*subtractMove*/ ctx[2]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*subtractMove*/ 4) set_data_dev(t1, /*subtractMove*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(230:5) <Button>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let title;
    	let t1;
    	let t2;
    	let body;
    	let current;
    	let if_block0 = /*visible*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = !/*visible*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			title = element("title");
    			title.textContent = "Calculator Game";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			body = element("body");
    			if (if_block1) if_block1.c();
    			add_location(title, file, 184, 1, 3322);
    			attr_dev(main, "class", "svelte-v92wms");
    			add_location(main, file, 183, 0, 3314);
    			add_location(body, file, 191, 0, 3549);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, title);
    			append_dev(main, t1);
    			if (if_block0) if_block0.m(main, null);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, body, anchor);
    			if (if_block1) if_block1.m(body, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*visible*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*visible*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*visible*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*visible*/ 1) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(body, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(body);
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function shuffle(array) {
    	let currentIndex = array.length, randomIndex;

    	// While there remain elements to shuffle.
    	while (currentIndex != 0) {
    		// Pick a remaining element.
    		randomIndex = Math.floor(Math.random() * currentIndex);

    		currentIndex--;

    		// And swap it with the current element.
    		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    	}

    	return array;
    }

    function timeout(delay) {
    	return new Promise(res => setTimeout(res, delay));
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let visible = false;
    	onMount(() => $$invalidate(0, visible = true));

    	document.onkeypress = function (event) {
    		$$invalidate(0, visible = false);
    	};

    	let addMove = 0;
    	let subtractMove = 0;
    	let multiplyMove = 0;
    	let divideMove = 0;
    	let start = 0;
    	let final = 0;
    	let number = final;
    	let multiplytries = 0;
    	let level = 1;
    	let ogmoves = 4;
    	let goal = start;
    	let movesLeft = ogmoves;

    	function generateLevel() {
    		$$invalidate(5, number = 0);
    		start = 0;
    		final = 0;
    		$$invalidate(8, movesLeft = ogmoves);
    		start = Math.floor(Math.random() * 18) + 2;
    		final = start;
    		var arr = [0, 1, 2, 3];
    		shuffle(arr);

    		for (let i = 0; i < arr.length; i++) {
    			if (arr[i] == 0) {
    				$$invalidate(1, addMove = Math.floor(Math.random() * 30) + 1);
    				final -= addMove;
    			}

    			if (arr[i] == 1) {
    				$$invalidate(2, subtractMove = Math.floor(Math.random() * 30) + 1);
    				final += subtractMove;
    			}

    			if (arr[i] == 2) {
    				$$invalidate(3, multiplyMove = Math.floor(Math.random() * 9) + 2);

    				while (final % multiplyMove != 0 && multiplytries <= 35) {
    					$$invalidate(3, multiplyMove = Math.floor(Math.random() * 9) + 2);
    					multiplytries++;
    				}

    				if (multiplytries >= 35) {
    					generateLevel();
    				}

    				final /= multiplyMove;
    			}

    			if (arr[i] == 3) {
    				$$invalidate(4, divideMove = Math.floor(Math.random() * 9) + 2);
    				final *= divideMove;
    			}
    		}

    		if (start == final) {
    			generateLevel();
    		}

    		if (multiplyMove == divideMove) {
    			generateLevel();
    		}

    		if (addMove == subtractMove) {
    			generateLevel();
    		}

    		$$invalidate(5, number = final);
    		$$invalidate(8, movesLeft = ogmoves);
    		$$invalidate(7, goal = start);
    	}

    	generateLevel();

    	function reset() {
    		if (number != "SUCCESS") {
    			$$invalidate(5, number = final);
    			$$invalidate(8, movesLeft = ogmoves);
    			$$invalidate(7, goal = start);
    		} else {
    			generateLevel();
    		}

    		if (goal == number) {
    			generateLevel();
    		}
    	}

    	function multiply(factor) {
    		if (movesLeft > 0) {
    			console.log($$invalidate(5, number *= factor));
    			$$invalidate(8, movesLeft--, movesLeft);
    		}

    		if (number == goal) {
    			$$invalidate(6, level++, level);
    			$$invalidate(8, movesLeft = 0);
    			$$invalidate(5, number = "SUCCESS");

    			setTimeout(
    				() => {
    					generateLevel();
    				},
    				2000
    			);
    		}
    	}

    	function add(amount) {
    		if (movesLeft > 0) {
    			console.log($$invalidate(5, number += amount));
    			$$invalidate(8, movesLeft--, movesLeft);
    		}

    		if (number == goal) {
    			$$invalidate(6, level++, level);
    			$$invalidate(8, movesLeft = 0);
    			$$invalidate(5, number = "SUCCESS");

    			setTimeout(
    				() => {
    					generateLevel();
    				},
    				2000
    			);
    		}
    	}

    	function subtract(amount) {
    		if (movesLeft > 0) {
    			console.log($$invalidate(5, number -= amount));
    			$$invalidate(8, movesLeft--, movesLeft);
    		}

    		if (number == goal) {
    			$$invalidate(6, level++, level);
    			$$invalidate(8, movesLeft = 0);
    			$$invalidate(5, number = "SUCCESS");

    			setTimeout(
    				() => {
    					generateLevel();
    				},
    				2000
    			);
    		}
    	}

    	function divide(factor) {
    		if (movesLeft > 0) {
    			if (number % factor == 0) {
    				console.log($$invalidate(5, number /= factor));
    				$$invalidate(8, movesLeft--, movesLeft);
    			} else {
    				$$invalidate(5, number = "ERROR");
    				$$invalidate(8, movesLeft = 0);
    			}
    		}

    		if (number == goal) {
    			$$invalidate(6, level++, level);
    			$$invalidate(8, movesLeft = 0);
    			$$invalidate(5, number = "SUCCESS");

    			setTimeout(
    				() => {
    					generateLevel();
    				},
    				2000
    			);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => add(addMove);
    	const click_handler_1 = () => multiply(multiplyMove);
    	const click_handler_2 = () => divide(divideMove);
    	const click_handler_3 = () => subtract(subtractMove);

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		onMount,
    		Button,
    		visible,
    		shuffle,
    		timeout,
    		addMove,
    		subtractMove,
    		multiplyMove,
    		divideMove,
    		start,
    		final,
    		number,
    		multiplytries,
    		level,
    		ogmoves,
    		goal,
    		movesLeft,
    		generateLevel,
    		reset,
    		multiply,
    		add,
    		subtract,
    		divide
    	});

    	$$self.$inject_state = $$props => {
    		if ('visible' in $$props) $$invalidate(0, visible = $$props.visible);
    		if ('addMove' in $$props) $$invalidate(1, addMove = $$props.addMove);
    		if ('subtractMove' in $$props) $$invalidate(2, subtractMove = $$props.subtractMove);
    		if ('multiplyMove' in $$props) $$invalidate(3, multiplyMove = $$props.multiplyMove);
    		if ('divideMove' in $$props) $$invalidate(4, divideMove = $$props.divideMove);
    		if ('start' in $$props) start = $$props.start;
    		if ('final' in $$props) final = $$props.final;
    		if ('number' in $$props) $$invalidate(5, number = $$props.number);
    		if ('multiplytries' in $$props) multiplytries = $$props.multiplytries;
    		if ('level' in $$props) $$invalidate(6, level = $$props.level);
    		if ('ogmoves' in $$props) ogmoves = $$props.ogmoves;
    		if ('goal' in $$props) $$invalidate(7, goal = $$props.goal);
    		if ('movesLeft' in $$props) $$invalidate(8, movesLeft = $$props.movesLeft);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		visible,
    		addMove,
    		subtractMove,
    		multiplyMove,
    		divideMove,
    		number,
    		level,
    		goal,
    		movesLeft,
    		reset,
    		multiply,
    		add,
    		subtract,
    		divide,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
