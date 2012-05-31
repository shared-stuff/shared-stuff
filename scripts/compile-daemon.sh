# sometimes it crashes, therefore we need this loop
trap 'exit 0' 2
while [ true ]
do
  echo "Start compiling..."
  coffee -cw -o app/js/gen app/js
  echo "Restart compiling..."
done