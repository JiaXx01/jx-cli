import { select, input, confirm } from '@inquirer/prompts'
import os from 'node:os'
import { NpmPackage } from '@jx-cli/utils'
import path from 'node:path'
import ora from 'ora'
import fse from 'fs-extra'
import ejs from 'ejs'
import { glob } from 'glob'

async function create(projectName?: string, projectTemplate?: string) {
  if (!projectTemplate) {
    projectTemplate = await select({
      message: '请选择项目模版',
      choices: [
        {
          name: 'react 项目',
          value: '@jx-cli/template-react'
        },
        {
          name: 'vue 项目',
          value: '@jx-cli/template-vue'
        }
      ]
    })
  }

  if (!projectName) {
    while (!projectName) {
      projectName = await input({ message: '请输入项目名' })
    }
  }

  const targetPath = path.join(process.cwd(), projectName)

  if (fse.existsSync(targetPath)) {
    const empty = await confirm({ message: '该目录不为空，是否清空' })
    if (empty) {
      fse.emptyDirSync(targetPath)
    } else {
      process.exit(0)
    }
  }

  // console.log(projectTemplate, projectName);

  const pkg = new NpmPackage({
    name: projectTemplate,
    targetPath: path.join(os.homedir(), '.jx-cli-template')
  })

  if (!(await pkg.exists())) {
    const spinner = ora('下载模版中...').start()
    await pkg.install()
    await sleep(1000)
    spinner.stop()
  } else {
    const spinner = ora('更新模版中...').start()
    await pkg.update()
    await sleep(1000)
    spinner.stop()
  }

  const spinner = ora('创建项目中...').start()
  await sleep(1000)

  const templatePath = path.join(pkg.npmFilePath, 'template')
  // const targetPath = path.join(process.cwd(), projectName)

  fse.copySync(templatePath, targetPath)

  const files = await glob('**', {
    cwd: targetPath,
    nodir: true,
    ignore: 'node_modules/**'
  })

  for (let i = 0; i < files.length; i++) {
    const filePath = path.join(targetPath, files[i])
    const renderResult = await ejs.renderFile(filePath, {
      projectName
    })
    fse.writeFileSync(filePath, renderResult)
  }

  spinner.stop()
}

function sleep(timeout: number) {
  return new Promise(resolve => {
    setTimeout(resolve, timeout)
  })
}

export default create
