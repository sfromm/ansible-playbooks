/* A simplified test runner, should be compatible with (a subset of) JsUnit.
 * Why? I do not like JsUnit's GUI.
 * Warning: this javascript is most likely terribly unportable.  If it breaks,
 * go download JsUnit from http://www.jsunit.net/
 */

/* Output formatter. */

function Reporter() {
    var element = document.getElementById('testoutput');
    if (!element) {
        element = document.createElement('div');
        document.body.appendChild(element);
    }
    this.outputelement = element;
    this.ntests = 0;
    this.nerrors = 0;
    this.nfailed = 0;
    this.first_failed_element = null;
}

Reporter.prototype.addElement = function(where, tag, cls, body) {
    var e = document.createElement(tag)
    if (cls) e.className = cls;
    if (body) e.innerHTML = body;
    where.appendChild(e);
    return e;
}
Reporter.prototype.addDiv = function(cls, body) {
    return this.addElement(this.outputelement, 'div', cls, body);
}
Reporter.prototype.addSpan = function(where, cls, body) {
    return this.addElement(where, 'span', cls, body);
}

Reporter.prototype.start = function() {
    this.start_timestamp = new Date();
    this.addDiv('header', 'Running tests on ' + this.start_timestamp.toLocaleString() + ':');
}

Reporter.prototype.stop = function() {
    this.stop_timestamp = new Date();
    var seconds = (this.stop_timestamp - this.start_timestamp) / 1000;
    var msg = 'Ran ' + this.ntests + ' tests in ' + seconds + ' seconds.' +
              '  There were ' + this.nerrors + ' errors and ' + this.nfailed + ' failures.';
    footer = this.addDiv('footer', msg);
    makeVisible(this.outputelement);
    makeVisible(footer);
    if (this.first_failed_element)
        makeVisible(this.first_failed_element);
}

Reporter.prototype.aboutToRunTest = function(testname) {
    var cls = "test";
    if (this.ntests % 2) cls += " even";
    else cls += " odd";
    this.cur_test_element = this.addDiv(cls, null);
    this.addSpan(this.cur_test_element, 'testname', testname);
    this.ntests++;
    makeVisible(this.cur_test_element);
}

Reporter.prototype.testSucceeded = function(testname) {
    this.addSpan(this.cur_test_element, 'success', 'OK');
    this.addSpan(this.cur_test_element, 'message', '');
    makeVisible(this.cur_test_element);
}

Reporter.prototype.testFailed = function(testname, exc) {
    this.addSpan(this.cur_test_element, 'failure', 'FAIL');
    var msg = exc.jsUnitMessage;
    if (exc.comment) msg = exc.comment + ":\n" + msg;
    this.addSpan(this.cur_test_element, 'message', msg);
    this.nfailed++;
    makeVisible(this.cur_test_element);
    if (!this.first_failed_element)
        this.first_failed_element = this.cur_test_element;
}

Reporter.prototype.testError = function(testname, exc) {
    this.addSpan(this.cur_test_element, 'error', 'ERROR');
    var msg;
    if (exc.description)
        msg = exc.description
    else {
        msg = exc.toString();
        for (var key in exc) {
            msg += "\n" + key + ": " + exc[key];
        }
    }
    this.addSpan(this.cur_test_element, 'message', msg);
    this.nerrors++;
    makeVisible(this.cur_test_element);
    if (!this.first_failed_element)
        this.first_failed_element = this.cur_test_element;
}

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

/* Test runner */

function TestRunner(reporter) {
    this.reporter = reporter;
    this.setUp = null;
    this.tearDown = null;
}

TestRunner.prototype.runTest = function(testname) {
    this.reporter.aboutToRunTest(testname);
    var test = eval(testname);
    var exc;
    /* Set up */
    if (this.setUp) {
        try {
            this.setUp();
        } catch (e) {
            exc = e;
        }
    }
    /* Test */
    if (!exc) {
        try {
            test();
        } catch (e) {
            exc = e;
        }
    }
    /* Tear down */
    if (this.tearDown) {
        try {
            this.tearDown();
        } catch (e) {
            if (!exc) exc = e;
        }
    }
    /* Report outcome */
    if (!exc)
        this.reporter.testSucceeded(testname);
    else if (exc.isJsUnitException)
        this.reporter.testFailed(testname, exc);
    else
        this.reporter.testError(testname, exc);
}

TestRunner.prototype.run = function(testnames) {
    this.reporter.start();
    for (var i = 0; i < testnames.length; i++) {
        var testname = testnames[i];
        this.runTest(testname);
    }
    this.reporter.stop();
}

function findAllTests() {
    if (window.exposeTestFunctionNames) {
        return exposeTestFunctionNames();
    }
    /* Well, let's try to find them then. */
    var testnames = [];
    var where = window;
    for (var name in where) { /* This won't work in MSIE */
        if (name.substring(0, 4) == 'test' && typeof(where[name]) == 'function')
            testnames.push(name);
    }
    if (!testnames.length) {
        /* Hmm, found nothing.  Could this be IE? */
        if (where.document && where.document.scripts) {
            /* Yep.  Time for ugly hacks.  We can try to find all functions
             * defined inline in the page itself, but not functions defined
             * in external script files.
             */
            for (var i = 0; i < where.document.scripts.length; i++) {
                var script = where.document.scripts[i].text;
                var idx = script.indexOf('function test');
                while (idx != -1) {
                    script = script.substring(idx + 'function '.length, script.length);
                    idx = script.indexOf('(')
                    name = script.substring(0, idx);
                    idx = script.indexOf('function test');
                }
            }
        }
    }
    return testnames;
}

function runAllTests() {
    reporter = new Reporter();
    runner = new TestRunner(reporter);
    runner.setUp = setUp;
    runner.tearDown = tearDown;
    runner.run(findAllTests());
}

