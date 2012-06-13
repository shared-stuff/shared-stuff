trap 'exit 0' 2
echo "Start compiling..."

# sometimes it crashes, therefore we need this loop
while [ true ]
do
  coffee -cw -o test/unit/gen test/unit
  echo "Restart compiling..."
done