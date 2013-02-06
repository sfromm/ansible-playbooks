# (C) 2013, Stephen Fromm, <sfromm@gmail.com>

# This file is part of Ansible
#
# Ansible is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Ansible is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Ansible.  If not, see <http://www.gnu.org/licenses/>.

import json
import datetime
import ansible.constants
from sqlalchemy import *
from sqlalchemy.orm import *
from sqlalchemy.ext.declarative import declarative_base

def log_result(res):
    ''' add result to database '''
    session.add(res)
    # would be nice if i didn't have to force a commit here
    session.commit()

def now():
    return datetime.datetime.now()

config = ansible.constants.load_config_file()
uri = ansible.constants.get_config(config, 'sqlalchemy', 'uri', None, 'sqlite://')
tablename = ansible.constants.get_config(config, 'sqlalchemy', None, 'tablename', 'host_result')

engine = create_engine(uri)
Base = declarative_base()

class AnsibleResult(Base):
    __tablename__ = tablename

    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=now())
    hostname = Column(String)
    module = Column(String)
    data = Column(Text)
    result = Column(String)

    def __init__(self, hostname, module, result, data, timestamp=now()):
        self.hostname = hostname
        self.timestamp = timestamp
        self.data = data
        self.module = module
        self.result = result

    def __repr__(self):
        return "<AnsibleResult<'%s', '%s', '%s'>" % (self.hostname, self.module, self.result)

Base.metadata.create_all(engine)
session = Session(engine)

class CallbackModule(object):

    """
    this will log json blobs to sql
    """

    def on_any(self, *args, **kwargs):
        pass

    def runner_on_failed(self, host, res, ignore_errors=False):
        module = res['invocation']['module_name']
        log_result(AnsibleResult(host, module, 'FAILED', json.dumps(res)))

    def runner_on_ok(self, host, res):
        module = res['invocation']['module_name']
        log_result(AnsibleResult(host, module, 'OK', json.dumps(res)))

    def runner_on_error(self, host, msg):
        log_result(AnsibleResult(host, None, 'ERROR', '{}'))

    def runner_on_skipped(self, host, item=None):
        log_result(AnsibleResult(host, None, 'SKIPPED', '{}'))

    def runner_on_unreachable(self, host, res):
        if not isinstance(res, dict):
            res2 = res
            res = {}
            res['msg'] = res2
        log_result(AnsibleResult(host, None, 'UNREACHABLE', json.dumps(res)))

    def runner_on_no_hosts(self):
        pass

    def runner_on_async_poll(self, host, res, jid, clock):
        pass

    def runner_on_async_ok(self, host, res, jid):
        pass

    def runner_on_async_failed(self, host, res, jid):
        log_result(AnsibleResult(host, None, 'ASYNC_FAILED', json.dumps(res)))

    def playbook_on_start(self):
        pass

    def playbook_on_notify(self, host, handler):
        pass

    def on_no_hosts_matched(self):
        pass

    def on_no_hosts_remaining(self):
        pass

    def playbook_on_task_start(self, name, is_conditional):
        pass

    def playbook_on_vars_prompt(self, varname, private=True, prompt=None, encrypt=None, confirm=False, salt_size=None, salt=None, default=None):
        pass

    def playbook_on_setup(self):
        pass

    def playbook_on_import_for_host(self, host, imported_file):
        pass

    def playbook_on_not_import_for_host(self, host, missing_file):
        pass

    def playbook_on_play_start(self, pattern):
        pass

    def playbook_on_stats(self, stats):
        pass

