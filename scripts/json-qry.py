#!/usr/bin/python

import os
import sys
import json
from optparse import OptionParser

def parse_json(data):
    return json.loads(data)

def parse_json_from_file(path):
    try:
        data = file(path).read()
        return parse_json(data)
    except IOError:
        print >>sys.stderr, 'file not found: %s' % path
        return None
    except Exception, e:
        print >>sys.stderr, 'failed to parse json from file: %s' % str(e)
        return None

def main(args):
    parser = OptionParser(usage="inspect json file for a key's value")
    parser.add_option('-f', '--file', type='string', help='path to json file')
    parser.add_option('-k', '--key', type='string', help='key to lookup')
    (options, args) = parser.parse_args()
    if not options.file or not options.key:
        print 'missing required options'
        return 1
    json = parse_json_from_file(options.file)
    if json is None:
        return 1
    if options.key in json:
        print json[options.key]
    else:
        return 1

if __name__ == '__main__':
    try:
        sys.exit(main(sys.argv[1:]))
    except KeyboardInterrupt, e:
        print >> sys.stderr, "Exiting on user request.\n"
        sys.exit(1)
