#!/usr/bin/env node
import {workspaceFingerprint} from './lib/core.mjs';console.log(JSON.stringify(workspaceFingerprint(),null,2));
