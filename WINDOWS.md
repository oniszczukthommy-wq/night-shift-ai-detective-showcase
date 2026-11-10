# Windows 开发与使用

目标：Windows 11 x64，Edge / Chrome。ARM64 Windows 与真实 GPU、摄像头、麦克风仍需独立验收。

## 首次安装

先安装 Git 与 Node.js 22（含 npm）。登录有权限的 GitHub 账号，克隆 **源码仓库**（名称不带 `-showcase`）。展示仓库只有介绍，不能运行。

```powershell
git clone https://github.com/oniszczukthommy-wq/night-shift-ai-detective.git
cd night-shift-ai-detective
powershell -NoProfile -ExecutionPolicy Bypass -File .\Windows.ps1 Setup
powershell -NoProfile -ExecutionPolicy Bypass -File .\Windows.ps1 Test
```

脚本只对这一次执行放行，不修改系统执行策略。安装命令失败会停止；既有 `.env` 不会被覆盖。

## 日常启动

双击 `Start-Windows.cmd`，或运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Windows.ps1 Start
```

在浏览器打开 http://127.0.0.1:4173/ 。终端按 Ctrl+C 停止。

安装 Node.js 22 LTS（含 npm）。无需额外 npm 依赖。Setup 复制示例配置；本地演练可不填 Key。真实 AI 案件需在 ai-detective-game/.env.local 填自己的 DeepSeek Key。源仓库保持私有，参考素材不公开。

## 继续开发与迁移

- 在 Windows 用 VS Code 等编辑器打开源码目录；本项目使用 Node.js，不需要 Python 虚拟环境。
- 用 Git 同步源码；虚拟环境、node_modules、Mac 的二进制工具都要重新安装，不能直接复制。
- 迁移前停止旧服务，单独备份整个 `data/`、用户工程、上传素材与相关数据库附属文件。新机器恢复后保留原备份，再核对项目数量和附件。
- 密钥只在新机器本机填写；不要提交 `.env`、个人数据或模型权重。
- 后续更新执行 `git pull --ff-only`，重新 Setup 与 Test。若已有本机改动，先保存提交再更新。

## 验证边界

`.github/workflows/windows.yml` 在 Windows runner 上执行同一安装与测试入口。
自动测试不调用付费模型，不代表真实模型质量、GPU 加速或硬件输入已经验收。具体结果看仓库 Actions；首次运行失败时不得视为已支持。

## 前四项目优先验收：本项目待办

Windows 自动测试会在包含中文和空格的临时路径实际启动服务，逐个核对浏览器脚本、Three.js、场景模型与贴图的 HTTP 内容，并检查无 Key 时的提示。测试不复制个人 `.env.local`，不调用付费模型。

本机浏览器已检查困难档的六人演练案件与 WebGL 场景；这不是联想电脑的显卡验收。到目标电脑后依次检查：标题模型加载完成 → 简单案件进入现场 → WASD 移动、E 交互、搜证与结案 → 困难档六人场景 → 配置 Key 后生成真实案件并提问。真实案件与语音输入仍待实机验证。
