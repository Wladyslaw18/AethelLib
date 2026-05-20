#!/bin/bash
git filter-branch -f --msg-filter "sed 's/LLM/Industrial/g; s/AI/Vector/g; s/llm/industrial/g; s/ai/vector/g'" -- --all
