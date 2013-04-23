/*
 * Javascript magic for planet mg.
 *
 * Warning: this javascript is most likely terribly unportable.
 *
 * vim:sw=4 sts=4 et:
 */

/* Global vars */
var g_collapsed = {};           /* Set of collapsed element IDs. */
var g_n_collapsed = 0;          /* Number of collapsed elements. */
var g_cur_entry = 0;            /* Current entry index. */
var g_keymap = {};              /* Character -> function. */
var g_initial_collapsed;        /* Entries that should be collapsed during load */
var g_prev_entries = [];        /* A list of entries that were there last time */
var g_finished_loading = false; /* Are we there yet? */
var g_original_title = null;    /* Original document title */
var g_save_queued = false;      /* Is a saveCookie call queued? */

/*
 * Return a list of all blog entries in order.
 */
function getEntries() {
    var entries = [];
    var divs = document.getElementsByTagName('div');
    for (var i = 0; i < divs.length; i++) {
        var div = divs[i];
        if (hasClass(div, "entrygroup"))
            entries.push(div);
    }
    return entries;
}

/*
 * Add a class on an element.
 * Handles multiple classes on one element.
 */
function addClass(element, cls) {
    if (hasClass(element, cls))
        return;
    var old_cls = element.className;
    if (old_cls) cls = cls + ' ' + old_cls;
    element.className = cls;
}

/*
 * Remove a class from an element.
 * Handles multiple classes on one element.
 */
function removeClass(element, cls) {
    var classes = element.className;
    if (!classes) return;
    var l = classes.split(' ');
    for (var i = 0; i < l.length; i++) {
        if (l[i] == cls) {
            l.splice(i, 1);
            break;
        }
    }
    element.className = l.join(' ');
}

/*
 * Check whether an element has a given class.
 * Handles multiple classes on one element.
 */
function hasClass(element, cls) {
    var classes = element.className;
    if (!classes) return false;
    var l = classes.split(' ');
    for (var i = 0; i < l.length; i++) {
        if (l[i] == cls) {
            return true;
        }
    }
    return false;
}

/*
 * Make sure element is visible, and if not, scroll the browser window.
 */
function makeVisible(element) {
    /* Find the location of element relative to document top. */
    var posY = element.offsetTop;
    var parent = element.offsetParent;
    while (parent) {
        posY += parent.offsetTop;
        parent = parent.offsetParent;
    }
    /* Define the range of values that we want to be onscreen (you can add
     * margins here). */
    var margin = 8;
    var top = posY - margin;
    var bottom = posY + element.offsetHeight + margin;
    /* Determine the range of values that currently are onscreen
     * (Note: might fail to deduce the height of a horizontal scrollbar)
     */
    var visible_top = window.scrollY;
    var visible_bottom = window.scrollY + window.innerHeight;
    /* Calculate the amount to scroll */
    var amount = 0;
    if (visible_top > top) {
        /* Top of our desired range is obscured. */
        amount = top - visible_top;
    } else if (bottom > visible_bottom) {
        /* Bottom of our desired range is obscured. */
        amount = bottom - visible_bottom;
        if (visible_top + amount > top) {
            /* The element doesn't fit on screen, make the topmost part of it
             * visible */
            amount = top - visible_top;
        }
    }
    if (amount) window.scrollBy(0, amount);
}

/*
 * Convert a UTC date/time string into local time.
 * Takes strings of the form 'YYYY-MM-DD HH:MM'.  Timezone offset is expressed
 * in minutes west of UTC (just use new Date().getTimezoneOffset()).
 * Returns a string of the form 'YYYY-MM-DD HH:MM +ZZ:ZZ'
 */
function convertDateTime(dt, offset) {
    var d = new Date(dt.substring(0, 4), dt.substring(5, 7) - 1,
                     dt.substring(8, 10), dt.substring(11, 13),
                     dt.substring(14, 16));
    d = new Date(d.valueOf() - offset * 60000); /* minutes to milliseconds */
    /* Date part */
    var yyyy = d.getFullYear();
    var mm = d.getMonth() + 1; if (mm < 10) mm = "0" + mm;
    var dd = d.getDate(); if (dd < 10) dd = "0" + dd;
    /* Time part */
    var hour = d.getHours(); if (hour < 10) hour = "0" + hour;
    var min = d.getMinutes(); if (min < 10) min = "0" + min;
    /* Timezone offset */
    var sign = "+";
    if (offset > 0) sign = "-"; /* Reverse the sign */
    var zh = Math.abs(offset) / 60; if (zh < 10) zh = "0" + zh;
    var zm = Math.abs(offset) % 60; if (zm < 10) zm = "0" + zm;
    return yyyy + "-" + mm + "-" + dd + " " + hour + ":" + min
           + " " + sign + zh + ":" + zm;
}

/*
 * Is an element collapsed?
 */
function isCollapsed(element) {
    return hasClass(element, 'collapse');
}

/*
 * Return a list of collapsed entry IDs.
 */
function getCollapsed() {
    var collapsed = [];
    var entries = getEntries();
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        if (isCollapsed(entry))
            collapsed.push(entry.id);
    }
    /* If we are saving a cookie during page load, do not clobber those entries
     * that weren't downloaded yet.
     */
    for (var old in g_initial_collapsed) {
        if (g_initial_collapsed[old]) {
            collapsed.push(old);
        }
    }
    return collapsed;
}

/*
 * Collapse/expand an element.
 */
function toggle(element) {
    doToggle(element);
    queueSaveCookie();
}

/*
 * Collapse/expand an element, and make it visible.
 */
function toggleAndShow(element) {
    toggle(element);
    makeVisible(element);
}

/*
 * Collapse/expand 'this'.  You can attach this function as an event handler
 * by doing element.onclick = toggleVisibility;
 */
function toggleVisibility() {
    toggle(this);
}

/*
 * Internal function that actually collapses/expands an entry.
 * Adds or removes 'collapse' from element's class attribute.
 * CSS rules then take care of the hiding.
 */
function doToggle(element) {
    if (isCollapsed(element)) {
        removeClass(element, 'collapse');
        delete g_collapsed[element.id];
        g_n_collapsed--;
    } else {
        addClass(element, 'collapse');
        g_collapsed[element.id] = true;
        g_n_collapsed++;
    }
}

/*
 * Load the collapsed set from a cookie called 'collapse'.
 * Does not touch any elements or global variables.
 */
function loadCookie() {
    var collapsed = {};
    var cookies = document.cookie.split(";");
    for (var i = 0; i < cookies.length; i++) {
        var parts = cookies[i].split("=");
        if (parts[0] == "collapse") {
            var ids = unescape(parts[1]).split(",");
            for (var j = 0; j < ids.length; j++) {
                var id = unescape(ids[j]);
                collapsed[id] = true;
            }
        }
    }
    return collapsed;
}

/* Save the collapsed set to a cookie called 'collapse'.
 * Does not touch any elements or global variables.
 */
function saveCookie(collapsed) {
    var ids = [];
    var lastgood;
    var limit = 4000;
    for (var i = 0; i < collapsed.length; i++) {
        var id = collapsed[i];
        ids.push(escape(id));
        var current = escape(ids.join(","));
        if (current.length < limit)
            lastgood = current
        else if (lastgood) {
            /* cookie size limit panic!  try to save at least a subset */
            document.cookie = "collapse=" + lastgood +
                              ";path=" + escape(window.location.pathname) +
                              ";expires=13-Oct-2036 12:00:00 GMT";
            lastgood = null;
        }
    }
    ids = ids.join(",");
    document.cookie = "collapse=" + escape(ids) +
                      ";path=" + escape(window.location.pathname) +
                      ";expires=13-Oct-2036 12:00:00 GMT";
}

/* Queue a save in 5 seconds.
 * If you queue several times, only one save will be performed.
 */
function queueSaveCookie() {
    if (g_save_queued) {
        return;
    }
    g_save_queued = true;
    window.setTimeout(performQueuedSaveCookie, 5000);
}

function performQueuedSaveCookie() {
    g_save_queued = false;
    saveCookie(getCollapsed());
}

/*
 * Update the counters shown on the bottom right corner.
 */
function updateStats() {
    var stats = document.getElementById('stats');
    if (!stats) {
        stats = document.createElement('div');
        stats.id = 'stats';
        stats.style.position = 'fixed';
        stats.style.bottom = 0;
        stats.style.right = 0;
        stats.style.padding = '2px 4px';
        stats.style.background = 'white';
        stats.style.zIndex = 1;
        document.body.appendChild(stats);
    }
    var total_entries = getEntries().length;
    var new_entries = total_entries - g_n_collapsed;
    stats.innerHTML = total_entries + ' entries, ' + new_entries + ' new.';
    if (!g_original_title) {
        g_original_title = document.title;
    }
    document.title = g_original_title + ' - ' + new_entries + ' new entries';
}

/*
 * Keyboard focus: return the currently focused element.
 */
function getCurEntry() {
    var entries = getEntries();
    return entries[g_cur_entry];
}

/*
 * Select given entry
 */
function selectEntry(n, focus) {
    var entries = getEntries();
    if (0 <= n && n < entries.length && n != g_cur_entry) {
        removeClass(entries[g_cur_entry], "current");
        g_cur_entry = n;
        addClass(entries[g_cur_entry], "current");
        if (focus) makeVisible(entries[g_cur_entry]);
    }
}

/*
 * Select this entry
 * Can be attached as an event handler
 */
function selectThisEntry() {
    var entries = getEntries();
    for (var n = 0; n < entries.length; n++) {
        if (entries[n] == this) {
            selectEntry(n, false);
        }
    }
}

/*
 * Select the next entry
 */
function nextEntry() {
    selectEntry(g_cur_entry + 1, true);
}

/*
 * Select the previous entry
 */
function prevEntry() {
    selectEntry(g_cur_entry - 1, true);
}

/*
 * Select the next unread entry
 */
function nextUnread() {
    var entries = getEntries();
    var n = g_cur_entry + 1;
    while (n < entries.length && isCollapsed(entries[n]))
        n++;
    if (n == entries.length) {
        n = 0;
        while (n < g_cur_entry && isCollapsed(entries[n]))
            n++;
    }
    selectEntry(n, true);
}

/*
 * Select the previous unread entry
 */
function prevUnread() {
    var entries = getEntries();
    var n = g_cur_entry - 1;
    while (n >= 0 && isCollapsed(entries[n]))
        n--;
    if (n < 0) {
        n = entries.length - 1;
        while (n > g_cur_entry && isCollapsed(entries[n]))
            n--;
    }
    selectEntry(n, true);
}

/* Expand/collapse the current entry */
function toggleCurrent() {
    toggleAndShow(getCurEntry());
}

/*
 * Collapse the current entry, then go to the previous unread entry
 */
function collapseThenPrevUnread() {
    var current = getCurEntry();
    if (!isCollapsed(current)) {
        toggle(current);
    }
    prevUnread();
}

/*
 * Collapse all articles
 */
function collapseAll() {
    var entries = getEntries();
    for (var i = 0; i < entries.length; i++) {
        if (!isCollapsed(entries[i])) {
            toggle(entries[i]);
        }
    }
}

/*
 * Collapse the current entry, then go to the next unread entry
 */
function collapseThenNextUnread() {
    var current = getCurEntry();
    if (!isCollapsed(current)) {
        toggle(current);
    }
    nextUnread();
}

/* Open link for the current entry in a new tab. */
function viewEntry() {
    var current = getCurEntry();
    var url = $('a.title', current).attr('href');
    window.open(url);
}

/*
 * Keyboard event dispatcher.
 */
function onKeyDown(e) {
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    if (e.modifiers && e.modifiers != Event.SHIFT_MASK)
        return; /* Ignore Ctrl/Alt+letter combinations */
    if (e.altKey || e.ctrlKey)
        return; /* Ignore Ctrl/Alt+letter combinations */
    if (code == 27) { /* Escape */
        hideHelp();
    }
}

function onKeyPress(e) {
    var code;
    if (!e) var e = window.event;
    if (e.keyCode) code = e.keyCode;
    else if (e.which) code = e.which;
    if (e.modifiers && e.modifiers != Event.SHIFT_MASK)
        return; /* Ignore Ctrl/Alt+letter combinations */
    if (e.altKey || e.ctrlKey)
        return; /* Ignore Ctrl/Alt+letter combinations */
    var ch = String.fromCharCode(code);
    if (g_keymap[ch]) {
        g_keymap[ch]();
        return false; /* Eat the event */
    }
}

/* Show help. */
function showHelp() {
    var helpbox = $('#keyboard-shortcuts');
    helpbox.css('margin-left', -helpbox.width()/2 + 'px');
    helpbox.css('margin-top', -helpbox.height()/2 + 'px');
    helpbox.toggle();
}

function hideHelp() {
    $('#keyboard-shortcuts').hide();
}

/* Keymap -- keep next to showHelp please */

g_keymap['?'] = showHelp;
g_keymap['t'] = viewEntry;
g_keymap['v'] = toggleCurrent;
g_keymap['o'] = toggleCurrent;
g_keymap['j'] = nextEntry;
g_keymap['k'] = prevEntry;
g_keymap['n'] = nextUnread;
g_keymap['p'] = prevUnread;
g_keymap['N'] = collapseThenNextUnread;
g_keymap['P'] = collapseThenPrevUnread;
g_keymap['A'] = collapseAll;

/*
 * Convert all times to user's local time zone.
 * This function is idempotent.  It looks for <span> elements with class 'date'
 * that contain a string of the form "YYYY-MM-DD HH:MM", and replaces it with a
 * converted string of the form "YYYY-MM-DD HH:MM +ZZ:ZZ".
 */
function convertTimesToLocal() {
    var elements = document.getElementsByTagName('span');
    var date_regex = /^\d\d\d\d-\d\d-\d\d \d\d:\d\d$/;
    var offset = new Date().getTimezoneOffset();
    for (var i = 0; i < elements.length; i++) {
        var e = elements[i];
        if (hasClass(e, "date") && date_regex.test(e.firstChild.nodeValue)) {
            e.firstChild.nodeValue = convertDateTime(e.firstChild.nodeValue,
                                                     offset);
        }
    }
}

/*
 * Collapse elements mentioned in the cookie while the page is loading.
 * Mark the first entry as selected for keyboard navigation, once it appear.
 * Maintain running updates of total/new posts in the corner.
 */
function initialUpdate() {
    var entries = getEntries();
    /* When the first entry appears, mark it as selected for keyboard
     * navigation */
    if (entries.length > 0 && g_prev_entries.length == 0)
        addClass(entries[g_cur_entry], 'current');
    /* Collapse entries that should be collapsed. */
    for (var i = g_prev_entries.length; i < entries.length; i++) {
        var element = entries[i];
        if (g_initial_collapsed[element.id] && !isCollapsed(element)) {
            doToggle(element);
            delete g_initial_collapsed[element.id];
        }
        element.onclick = selectThisEntry;
    }
    g_prev_entries = entries;
    /* Convert times to local time zone. */
    convertTimesToLocal();
    if (document.getElementsByClassName) {
        var elements = document.getElementsByClassName("tz-notice");
        for (var i = 0; i < elements.length; i++) {
            var e = elements[i];
            e.style.display = 'none';
        }
    }
    /* Repeat this every second until the document is fully loaded. */
    if (!g_finished_loading) {
        window.setTimeout(initialUpdate, 1000);
    }
}

/*
 * Collapse elements mentioned in the cookie when the page finishes loading.
 */
function onLoadHook() {
    g_finished_loading = true;
    initialUpdate();
    g_initial_collapsed = [];
    g_prev_entries = [];
}

/*
 * Save the cookie (if a save was queued) when the user closes the window or
 * navigates away.
 */
function onUnloadHook() {
    if (g_save_queued) {
        performQueuedSaveCookie();
    }
}

/* Attach event handlers. */
g_initial_collapsed = loadCookie();
window.onload = onLoadHook;
window.onunload = onUnloadHook;
document.onkeypress = onKeyPress;
document.onkeydown = onKeyDown;
window.setTimeout(initialUpdate, 1000);
$(function(){
    $("#keyboard-shortcuts").click(hideHelp);
    $(".alttextwrapper").click(function(e){
        e.preventDefault();
        $('.alttext', this).toggle();
    });
});
