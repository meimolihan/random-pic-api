@echo off
setlocal enabledelayedexpansion

:: 配置区
set "default_prefix=2d"

:: 用户输入交互
set /p "prefix=请输入文件名前缀（默认 %default_prefix%）："
if "%prefix%"=="" set "prefix=%default_prefix%"
echo 正在使用前缀：[%prefix%]

:: 输入起始编号，默认 1
set /p "start_number=请输入起始编号（默认 1）："
if "%start_number%"=="" set /a start_number=1

:: 初始化计数器
set /a counter=%start_number%
set "error_log=rename_errors.log"
set "temp_folder=temp_rename_folder"

:: 清空旧日志
if exist "%error_log%" del "%error_log%"

:: 创建临时文件夹
if not exist "%temp_folder%" mkdir "%temp_folder%"

:: 移动所有.webp文件到临时文件夹
for /f "delims=" %%F in ('dir /b /a-d /o:d *.webp') do (
    move "%%F" "%temp_folder%\"
    if errorlevel 1 (
        echo 错误：移动文件失败 %%F >> %error_log%
    )
)

:: 从临时文件夹将文件重新命名移回到原目录
for /f "delims=" %%F in ('dir /b /a-d /o:d "%temp_folder%\*.webp"') do (
    call :rename_proc "%%~F"
)

:: 删除临时文件夹
if exist "%temp_folder%" rmdir "%temp_folder%"

:: 执行结果报告
echo ---------------------------
if exist "%error_log%" (
    echo 操作完成，但发现错误！详情见 %error_log%
    type "%error_log%"
) else (
    echo 所有文件已成功重命名！
)
pause
exit

:: 核心重命名过程
:rename_proc
set "old_file=%temp_folder%\%~1"

:: 生成三位数编号
:generate_number
set /a cnt=1000 + counter
set "cnt=!cnt:~1!"
set "new_file=%prefix%-!cnt!.webp"

:: 冲突检测（避免覆盖已有文件）
if exist "%new_file%" (
    set /a counter+=1
    goto generate_number
)

:: 执行重命名并移动
echo 正在重命名并移动："%old_file%" → %new_file%
move "%old_file%" "%new_file%"

:: 错误检测
if errorlevel 1 (
    echo 错误：重命名并移动失败 "%old_file%" → %new_file% >> %error_log%
) else (
    set /a counter+=1
)
goto :eof