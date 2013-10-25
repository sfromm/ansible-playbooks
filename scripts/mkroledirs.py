#!/usr/bin/python

import os
import sys
from optparse import OptionParser

role_dirs = ['files', 'handlers', 'tasks', 'templates', 'vars']
base_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..', 'roles')
        )

def mk_role_dirs(role):
    for subdir in role_dirs:
        path = os.path.join(base_dir, role, subdir)
        if os.path.exists(path) and os.path.isdir(path):
            continue
        try:
            os.makedirs(path)
        except OSError, e:
            print >> sys.stderr, 'failed to mkdir: %s' % str(e)
            raise

def main(args):
    parser = OptionParser()
    parser.add_option('-r', '--role', type='string',
                      help='role to create')
    (options, args) = parser.parse_args()
    if not options.role:
        print >> sys.stderr, 'require role option missing.\n'
    mk_role_dirs(options.role)
    print 'success creating %s role directories' % options.role

if __name__ == '__main__':
    try:
        sys.exit(main(sys.argv[1:]))
    except KeyboardInterrupt, e:
        print >> sys.stderr, "Exiting on user request.\n"
        sys.exit(1)
