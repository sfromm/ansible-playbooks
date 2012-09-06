AIDE playbook
=============

This is meant to be included from another playbook, eg. site_common.yml,
with contents similar to:

    ---
    - hosts: all

    - include: aide/main.yml

This playbook will install aide, copy into place aide.conf, and run
*aide --init* to create the AIDE database.

For more information on AIDE, see http://aide.sourceforge.net/.
