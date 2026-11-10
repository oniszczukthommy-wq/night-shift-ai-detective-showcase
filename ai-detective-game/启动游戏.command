#!/bin/zsh
cd "$(dirname "$0")" || exit 1
NODE="$(command -v node)"
if [[ -z "$NODE" || ! -x "$NODE" ]]; then
  echo '找不到 Node.js 20+，请先安装 Node.js（https://nodejs.org/）。'
  read -r '?按回车键关闭。'
  exit 1
fi
"$NODE" scripts/start-local.mjs "$@"
RESULT=$?
if [[ $RESULT -ne 0 ]]; then
  read -r '?按回车键关闭。'
fi
exit $RESULT
