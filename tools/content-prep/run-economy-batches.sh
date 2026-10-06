#!/usr/bin/env bash
# T6 批量采样 runner:固定种子清单,分批调用现有脚本(不修改 scripts/**),串行推进。
# 每批退出码立即落盘;一批失败不阻断后续批(记录后继续),最终汇总。
set -u
cd "D:/下载/clickpocalypse2-main"
LOGDIR=output/glm-r52/logs
mkdir -p "$LOGDIR"
overall=0
for i in 2 3 4 5 6 7 8 9 10 11; do
  start=$(( (i-2)*10 + 11 ))
  end=$(( start + 9 ))
  seeds=""
  for n in $(seq -w "$start" "$end"); do
    seeds="${seeds}内容验收-${n}|"
  done
  seeds="${seeds%|}"
  out="glm-r52-batch-$(printf '%03d' "$i").json"
  echo "=== batch $i : seeds ${start}-${end} -> $out ==="
  node scripts/analyze-expedition-economy.mjs "--seeds=$seeds" '--outings=8' '--delta=240' "--output=$out" > "$LOGDIR/t6-batch-$i.log" 2>&1
  code=$?
  echo "$code" > "$LOGDIR/t6-batch-$i.exit"
  echo "batch $i EXIT=$code"
  if [ "$code" -ne 0 ]; then overall=1; tail -5 "$LOGDIR/t6-batch-$i.log"; fi
done
echo "ALL_BATCHES_DONE overall=$overall"
exit "$overall"
