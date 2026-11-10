# 本机参考资源转换

在项目根目录使用已经建立的 `.venv-tunic-analysis/bin/python`，按顺序运行：

1. `ai-detective-game/scripts/import-reference-assets.py`：狐狸、桌凳、拱门、宝箱、预留房屋，以及六套 Escape Simulator 人物部件、骨骼和材质。
2. `ai-detective-game/scripts/import-title-sword.py`：标题长剑、源子网格、发光遮罩和 caustic 纹理。
3. `ai-detective-game/scripts/import-evidence-props.py`：从已经归档的 Victorian1 场景中转换茶杯、纸张、钥匙和含瓶塞的瓶子；保留子层级，排除房间谜题代币。
4. `ai-detective-game/scripts/finalize-reference-assets.py`：完整运行文件哈希与来源对象记录。

输入是用户这台 Mac 的既有游戏安装目录和 `research/` 归档，不修改原游戏文件。不包含原始作者工程或完整运行逻辑。
