/* Unit tests for planet.js */

var test_saved_state = {};

function setUp() {
    /* Save state */
    test_saved_state.g_collapsed = g_collapsed;
    test_saved_state.g_n_collapsed = g_n_collapsed;
    test_saved_state.g_cur_entry = g_cur_entry;
    test_saved_state.g_keymap = g_keymap;
    test_saved_state.g_initial_collapsed = g_initial_collapsed;
    test_saved_state.cookies = document.cookie;
    /* Reset state */
    g_collapsed = {};
    g_initial_collapsed = {};
    g_n_collapsed = 0;
    g_cur_entry = 0;
    g_keymap = {};
    document.cookie = "collapse=;path=" + escape(window.location.pathname);
    var entries = getEntries();
    for (var i = 0; i < entries.length; i++) {
        removeClass(entries[i], "current");
        removeClass(entries[i], "collapse");
    }
    if (entries.length)
        addClass(entries[0], "current");
}

function tearDown() {
    /* Restore saved state */
    g_collapsed = test_saved_state.g_collapsed;
    g_n_collapsed = test_saved_state.g_n_collapsed;
    g_cur_entry = g_cur_entry;
    g_keymap = test_saved_state.g_keymap;
    g_initial_collapsed = test_saved_state.g_initial_collapsed;
    var cookies = test_saved_state.cookies.split(';');
    for (var i = 0; i < cookies.length; i++) {
        document.cookie = cookies[i] + ";path=" + escape(window.location.pathname);
    }
}

function test_getEntries() {
    var entries = getEntries();
    var ids = [];
    for (var i = 0; i < entries.length; i++)
        ids.push(entries[i].id);
    assertEquals("entries", 'id1,id2,id3,id4', ids.join(','));
}

function test_addClass_on_empty_element() {
    var element = document.createElement('div');
    addClass(element, "test");
    assertEquals('test', element.className);
}

function test_addClass_on_nonempty_element() {
    var element = document.createElement('div');
    element.className = "foo";
    addClass(element, "test");
    assertEquals('test foo', element.className);
}

function test_addClass_on_nonempty_element_multiple() {
    var element = document.createElement('div');
    element.className = "foo bar";
    addClass(element, "test");
    assertEquals('test foo bar', element.className);
}

function test_addClass_repeated() {
    var element = document.createElement('div');
    element.className = "foo bar";
    addClass(element, "bar");
    assertEquals('foo bar', element.className);
}

function test_removeClass_on_empty_element() {
    var element = document.createElement('div');
    removeClass(element, "test");
    assertEquals('', element.className);
}

function test_removeClass_with_single_class() {
    var element = document.createElement('div');
    element.className = "test";
    removeClass(element, "test");
    assertEquals("", element.className);
}

function test_removeClass_with_other_class() {
    var element = document.createElement('div');
    element.className = "sample";
    removeClass(element, "test");
    assertEquals("sample", element.className);
}

function test_removeClass_with_many_classes() {
    var element = document.createElement('div');
    element.className = "foo bar baz";
    removeClass(element, "foo");
    assertEquals("bar baz", element.className);
    element.className = "foo bar baz";
    removeClass(element, "bar");
    assertEquals("foo baz", element.className);
    element.className = "foo bar baz";
    removeClass(element, "baz");
    assertEquals("foo bar", element.className);
    element.className = "foo bar baz";
    removeClass(element, "quux");
    assertEquals("foo bar baz", element.className);
}

function test_removeClass_substrings() {
    var element = document.createElement('div');
    element.className = "foobarbaz";
    removeClass(element, "foo");
    assertEquals("foobarbaz", element.className);
    removeClass(element, "bar");
    assertEquals("foobarbaz", element.className);
    removeClass(element, "baz");
    assertEquals("foobarbaz", element.className);
}

function test_hasClass_without_class() {
    var element = document.createElement('div');
    assertEquals(false, hasClass(element, "foo"));
}

function test_hasClass_with_one_class() {
    var element = document.createElement('div');
    element.className = "foo";
    assertTrue("foo", hasClass(element, "foo"));
    assertFalse("bar", hasClass(element, "bar"));
}

function test_hasClass_with_many_classes() {
    var element = document.createElement('div');
    element.className = "foo bar";
    assertTrue("foo", hasClass(element, "foo"));
    assertTrue("bar", hasClass(element, "bar"));
    assertFalse("baz", hasClass(element, "baz"));
}

function test_hasClass_substrings() {
    var element = document.createElement('div');
    element.className = "foobarbaz";
    assertEquals(false, hasClass(element, "foo"));
    assertEquals(false, hasClass(element, "bar"));
    assertEquals(false, hasClass(element, "baz"));
}

function test_isCollapsed() {
    var element = document.getElementById('id1');
    assertEquals("initially", false, isCollapsed(element));
    addClass(element, 'collapse');
    assertEquals("when collapsed", true, isCollapsed(element));
    removeClass(element, 'collapse'); /* clean up */
    assertEquals("when expanded", false, isCollapsed(element));
}

function test_getCollapsed() {
    var element1 = document.getElementById('id1');
    var element2 = document.getElementById('id2');
    var result = getCollapsed();
    assertEquals("initially", "", result.join());
    addClass(element1, 'collapse');
    var result = getCollapsed();
    assertEquals("one", "id1", result.join());
    addClass(element2, 'collapse');
    var result = getCollapsed();
    assertEquals("two", "id1,id2", result.join());
    g_initial_collapsed['id42'] = 1;
    var result = getCollapsed();
    assertEquals("with initial", "id1,id2,id42", result.join());
}

function test_toggle() {
    var element = document.getElementById('id1');
    assertEquals("initially", false, hasClass(element, "collapse"));
    toggle(element);
    assertEquals("once toggled", true, hasClass(element, "collapse"));
    if (!g_save_queued) fail("saveCookie not queued");
    performQueuedSaveCookie();
    if (!loadCookie()['id1']) fail("id1 not added to cookie");
    var stats = document.getElementById('stats');
    assertEquals("stats were updated", "4 entries, 3 new.", stats.innerHTML);
    toggle(element);
    assertEquals("twice toggled", false, hasClass(element, "collapse"));
    if (!g_save_queued) fail("saveCookie not queued");
    performQueuedSaveCookie();
    if (loadCookie()['id1']) fail("id1 not removed from cookie");
    assertEquals("stats were updated again", "4 entries, 4 new.", stats.innerHTML);
}

function test_toggleAndShow() {
    /* This bit copied from test_toggle() */
    var element = document.getElementById('id1');
    assertEquals("initially", false, hasClass(element, "collapse"));
    toggleAndShow(element);
    assertEquals("once toggled", true, hasClass(element, "collapse"));
    if (!g_save_queued) fail("saveCookie not queued");
    performQueuedSaveCookie();
    if (!loadCookie()['id1']) fail("id1 not added to cookie");
    var stats = document.getElementById('stats');
    assertEquals("stats were updated", "4 entries, 3 new.", stats.innerHTML);
    toggleAndShow(element);
    assertEquals("twice toggled", false, hasClass(element, "collapse"));
    if (!g_save_queued) fail("saveCookie not queued");
    performQueuedSaveCookie();
    if (loadCookie()['id1']) fail("id1 not removed from cookie");
    assertEquals("stats were updated again", "4 entries, 4 new.", stats.innerHTML);
    /* I don't know how to test the makeVisible part */
}

function test_toggleVisibility() {
    var element = document.getElementById('id1');
    assertEquals("initially", false, hasClass(element, "collapse"));
    element.toggleVisibility = toggleVisibility; /* attach to element, to bind 'this' */
    element.toggleVisibility();
    assertEquals("once toggled", true, hasClass(element, "collapse"));
    if (!g_save_queued) fail("saveCookie not queued");
    performQueuedSaveCookie();
    if (!loadCookie()['id1']) fail("id1 not added to cookie");
    var stats = document.getElementById('stats');
    assertEquals("stats were updated", "4 entries, 3 new.", stats.innerHTML);
    element.toggleVisibility();
    assertEquals("twice toggled", false, hasClass(element, "collapse"));
    if (!g_save_queued) fail("saveCookie not queued");
    performQueuedSaveCookie();
    if (loadCookie()['id1']) fail("id1 not removed from cookie");
    assertEquals("stats were updated again", "4 entries, 4 new.", stats.innerHTML);
}

function test_doToggle() {
    var element = document.getElementById('id1');
    assertEquals("initially", false, hasClass(element, "collapse"));
    toggle(element);
    assertEquals("once toggled", true, hasClass(element, "collapse"));
    toggle(element);
    assertEquals("twice toggled", false, hasClass(element, "collapse"));
}

/* Helper */
function trueKeysOf(dict) {
    var keys = [];
    for (var k in dict) {
        if (dict[k]) keys.push(k);
    }
    keys.sort();
    return keys.join();
}

function test_trueKeysOf() {
    var d = {};
    assertEquals("", trueKeysOf(d));
    d['a'] = 1;
    assertEquals("a", trueKeysOf(d));
    d['b'] = 0;
    assertEquals("a", trueKeysOf(d));
    d['c'] = true;
    assertEquals("a,c", trueKeysOf(d));
    d['d'] = null;
    assertEquals("a,c", trueKeysOf(d));
}

function test_loadCookie_empty() {
    var collapsed = loadCookie();
    assertEquals("", trueKeysOf(collapsed));
}

function test_loadCookie_other_cookies_only() {
    document.cookie = "collapse=;path=" + escape(window.location.pathname);
    document.cookie = "foo=42";
    document.cookie = "bar=55";
    var collapsed = loadCookie();
    assertEquals("", trueKeysOf(collapsed));
}

function test_loadCookie_single_element() {
    document.cookie = "collapse=id1;path=" + escape(window.location.pathname);
    var collapsed = loadCookie();
    assertEquals("id1", trueKeysOf(collapsed));
}

function test_loadCookie_many_elements() {
    document.cookie = "collapse=id1%2Cid%2532;path=" + escape(window.location.pathname);
    var collapsed = loadCookie();
    assertEquals("id1,id2", trueKeysOf(collapsed));
}

function test_saveCookie() {
    saveCookie(['id1', 'id42']);
    assertEquals('id1,id42', trueKeysOf(loadCookie()));
}

function test_saveCookie_escaping() {
    saveCookie(['all sorts of nasty chars: , - ;']);
    assertEquals('all sorts of nasty chars: , - ;', trueKeysOf(loadCookie()));
}

function test_saveCookie_loooong() {
    /* XXX this test does not appear to work.
     *     I always get "wonderful", even after upping the limit to 8000.
     *     but in real life cookies fail to work.
     */
    var ids = [];
    var i = 1;
    var lastgood;
    var toolong;
    while (true) {
        ids.push(['id' + i]);
        toolong = escape(ids.join(','));
        if (toolong.length < 4000) {
            lastgood = toolong;
            break;
        }
        i++;
    }
    saveCookie(ids);
    var result = trueKeysOf(loadCookie());
    if (result == toolong) {
        info("wonderful!");
    } else if (result == lastgood) {
        info("acceptable");
    } else {
        fail("failed to save too long list, got only " + result);
    }
}

function test_updateStats() {
    var stats = document.getElementById('stats');
    if (stats) stats.parentNode.removeChild(stats);
    stats = document.getElementById('stats');
    assertEquals("test fixture", null, stats);

    updateStats();
    stats = document.getElementById('stats');
    assertEquals("stats", stats.id);
    assertEquals("4 entries, 4 new.", stats.innerHTML);
    assertEquals("Unit tests for Planet Mg javascript - 4 new entries", document.title);

    g_n_collapsed++;
    updateStats();
    assertEquals("4 entries, 3 new.", stats.innerHTML);
    assertEquals("Unit tests for Planet Mg javascript - 3 new entries", document.title);
    g_n_collapsed--;
}

function test_onLoadHook() {
    g_initial_collapsed = {};
    g_initial_collapsed['id1'] = 1;
    g_initial_collapsed['id3'] = 1;
    onLoadHook();
    assertEquals("", trueKeysOf(g_initial_collapsed));
    assertEquals("id1,id3", trueKeysOf(g_collapsed));
    var stats = document.getElementById('stats');
    assertEquals("4 entries, 2 new.", stats.innerHTML);
    var element1 = document.getElementById('id1');
    assertTrue("first element is marked current", hasClass(element1, 'current'));
}

function test_getCurEntry() {
    var element1 = document.getElementById('id1');
    var element2 = document.getElementById('id2');
    g_cur_entry = 0;
    assertEquals("id1", element1, getCurEntry());
    g_cur_entry = 1;
    assertEquals("id2", element2, getCurEntry());
}

function test_nextEntry() {
    var element1 = document.getElementById('id1');
    var element2 = document.getElementById('id2');
    /* initial state */
    assertEquals(0, g_cur_entry);
    assertTrue("id1 has focus", hasClass(element1, 'current'));
    assertFalse("id1 has focus", hasClass(element2, 'current'));
    nextEntry();
    assertEquals(1, g_cur_entry);
    assertFalse("id2 has focus", hasClass(element1, 'current'));
    assertTrue("id2 has focus", hasClass(element2, 'current'));
    nextEntry();
    assertEquals(2, g_cur_entry);
    nextEntry();
    assertEquals(3, g_cur_entry);
    nextEntry();
    assertEquals(3, g_cur_entry);
}

function test_prevEntry() {
    var element1 = document.getElementById('id1');
    var element2 = document.getElementById('id2');
    /* initial state */
    assertEquals(0, g_cur_entry);
    assertTrue("id1 has focus", hasClass(element1, 'current'));
    assertFalse("id1 has focus", hasClass(element2, 'current'));
    prevEntry();
    assertEquals(0, g_cur_entry);
    /* let's change the state */
    nextEntry();
    assertEquals(1, g_cur_entry);
    assertFalse("id2 has focus", hasClass(element1, 'current'));
    assertTrue("id2 has focus", hasClass(element2, 'current'));
    prevEntry();
    assertEquals(0, g_cur_entry);
    assertTrue("id1 has focus", hasClass(element1, 'current'));
    assertFalse("id1 has focus", hasClass(element2, 'current'));
}

function test_toggleCurrent() {
    var element = document.getElementById('id3');
    assertEquals("initially", false, isCollapsed(element));
    g_cur_entry = 2;
    toggleCurrent();
    assertEquals("toggle", true, isCollapsed(element));
    toggleCurrent();
    assertEquals("toggle again", false, isCollapsed(element));
}

var g_test_bit = 0;
function test_onKeyPress() {
    g_keymap = {};
    g_keymap['a'] = function() { g_test_bit = 1; }
    g_keymap['A'] = function() { g_test_bit = 2; }
    g_test_bit = 0;
    e = new Object(); e.keyCode = 'a'.charCodeAt(0);
    assertEquals("a eaten", false, onKeyPress(e));
    assertEquals("a pressed", 1, g_test_bit);

    g_test_bit = 0;
    e = new Object(); e.keyCode = 'A'.charCodeAt(0);
    assertEquals("A eaten", false, onKeyPress(e));
    assertEquals("A pressed", 2, g_test_bit);

    g_test_bit = 0;
    e = new Object(); e.keyCode = 'b'.charCodeAt(0);
    assertNotEquals("b eaten", false, onKeyPress(e));
    assertEquals("b pressed", 0, g_test_bit);

    g_test_bit = 0;
    e = new Object(); e.keyCode = 'a'.charCodeAt(0);
    e.altKey = true;
    assertNotEquals("Alt+A eaten", false, onKeyPress(e));
    assertEquals("Alt+A pressed", 0, g_test_bit);
}

function test_convertDateTime() {
    assertEquals('2005-03-12 14:15 +00:00',
                 convertDateTime('2005-03-12 14:15', 0));
    assertEquals('2005-03-12 16:15 +02:00',
                 convertDateTime('2005-03-12 14:15', -120));
    assertEquals('2005-12-31 23:59 +00:00',
                 convertDateTime('2005-12-31 23:59', 0));
    assertEquals('2006-01-01 00:59 +01:00',
                 convertDateTime('2005-12-31 23:59', -60));
    assertEquals('2004-12-31 23:00 -01:00',
                 convertDateTime('2005-01-01 00:00', 60));
}

function test_onUnloadHook() {
    var old = performQueuedSaveCookie;
    var performQueuedSaveCookie_called = false;
    performQueuedSaveCookie = function() {
       performQueuedSaveCookie_called = true;
    };
    g_save_queued = false;
    onUnloadHook();
    assertFalse("called performQueuedSaveCookie",
                performQueuedSaveCookie_called);
    g_save_queued = true;
    onUnloadHook();
    assertTrue("did not call performQueuedSaveCookie",
               performQueuedSaveCookie_called);
    performQueuedSaveCookie = old;
}

function test_convertTimesToLocal() {
    var timelink = document.getElementById('timelink').firstChild;
    var nontimelink = document.getElementById('nontimelink').firstChild;
    var localtime_regexp = /^\d\d\d\d-\d\d-\d\d \d\d:\d\d [+-]\d\d:\d\d$/;
    convertTimesToLocal();
    assert("timelink was not converted",
           localtime_regexp.test(timelink.nodeValue));
    assert("nontimelink was converted",
           !localtime_regexp.test(nontimelink.nodeValue));
}

/* Crutch for MSIE */
function exposeTestFunctionNames() {
    return [
        'test_getEntries',
        'test_addClass_on_empty_element',
        'test_addClass_on_nonempty_element',
        'test_addClass_on_nonempty_element_multiple',
        'test_addClass_repeated',
        'test_removeClass_on_empty_element',
        'test_removeClass_with_single_class',
        'test_removeClass_with_other_class',
        'test_removeClass_with_many_classes',
        'test_removeClass_substrings',
        'test_hasClass_without_class',
        'test_hasClass_with_one_class',
        'test_hasClass_with_many_classes',
        'test_hasClass_substrings',
        'test_isCollapsed',
        'test_getCollapsed',
        'test_toggle',
        'test_toggleAndShow',
        'test_toggleVisibility',
        'test_doToggle',
        'test_trueKeysOf',
        'test_loadCookie_empty',
        'test_loadCookie_other_cookies_only',
        'test_loadCookie_single_element',
        'test_loadCookie_many_elements',
        'test_saveCookie',
        'test_saveCookie_escaping',
        'test_saveCookie_loooong',
        'test_updateStats',
        'test_onLoadHook',
        'test_onUnloadHook',
        'test_getCurEntry',
        'test_nextEntry',
        'test_prevEntry',
        'test_toggleCurrent',
        'test_onKeyPress',
        'test_convertDateTime',
        'test_convertTimesToLocal'
    ];
}
