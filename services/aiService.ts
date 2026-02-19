// AI Service for Tomorrow - Supports two modes: recommendation and explanation

const API_BASE_URL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api/v1';

export type ChatMode = 'recommend' | 'explain' | 'code-generate';

export interface GeneratedProject {
  type: 'single-file' | 'multi-file';
  code?: string;
  files?: Array<{ path: string; content: string }>;
  entryFile?: string;
  explanation: string;
  changes: string[];
}

function parseMarkdownResponse(text: string, originalCode: string): GeneratedProject {
  console.log('=== Starting parseMarkdownResponse ===');
  console.log('Text length:', text.length);
  console.log('First 500 chars:', text.substring(0, 500));
  
  try {
    const jsonResult = tryParseJson(text, originalCode);
    if (jsonResult) {
      console.log('JSON parse succeeded');
      return jsonResult;
    }
  } catch (e) {
    console.log('JSON parse failed, trying Markdown:', e);
  }

  const unescapeCode = (str: string): string => {
    return str
      .replace(/\\\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\\\t/g, '\t')
      .replace(/\\t/g, '\t')
      .replace(/\\\\"/g, '"')
      .replace(/\\"/g, '"')
      .replace(/\\\\'/g, "'")
      .replace(/\\'/g, "'")
      .replace(/\\\\\\/g, '/')
      .replace(/\\\//g, '/');
  };

  const isCodeLike = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    return (
      lowerContent.includes('<!doctype') ||
      lowerContent.includes('<html') ||
      lowerContent.includes('<script') ||
      lowerContent.includes('function') ||
      lowerContent.includes('const ') ||
      lowerContent.includes('let ') ||
      lowerContent.includes('var ') ||
      content.length > 500
    );
  };

  const isExplanationLike = (content: string): boolean => {
    const lowerContent = content.toLowerCase();
    return (
      content.length < 2000 &&
      !isCodeLike(content) &&
      (lowerContent.includes('已') ||
       lowerContent.includes('完成') ||
       lowerContent.includes('添加') ||
       lowerContent.includes('修改') ||
       lowerContent.includes('实现') ||
       lowerContent.includes('功能') ||
       lowerContent.includes('代码') ||
       lowerContent.includes('升级'))
    );
  };

  const codeBlocks: Array<{ content: string; lang: string }> = [];
  const nonCodeParts: string[] = [];
  const changes: string[] = [];
  let files: Array<{ path: string; content: string }> = [];
  let entryFile = 'index.html';

  const lines = text.split('\n');
  let inCodeBlock = false;
  let currentCode = '';
  let currentLang = '';
  let currentFileName = '';
  let currentNonCode = '';

  console.log('Starting line-by-line parsing, total lines:', lines.length);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        currentLang = line.trim().slice(3).toLowerCase() || 'html';
        currentCode = '';
        
        if (currentNonCode.trim()) {
          nonCodeParts.push(currentNonCode.trim());
          currentNonCode = '';
        }
        
        console.log('Entering code block at line', i, 'lang:', currentLang);
        
        if (!currentFileName) {
          const prevLine = i > 0 ? lines[i - 1].trim() : '';
          if (prevLine.startsWith('###') || prevLine.startsWith('##') || prevLine.startsWith('#')) {
            currentFileName = prevLine.replace(/^#+\s*/, '').trim();
            console.log('Found filename from previous line:', currentFileName);
          }
        }
      } else {
        inCodeBlock = false;
        
        console.log('Exiting code block, currentFileName:', currentFileName, 'files.length:', files.length);
        console.log('Code length:', currentCode.length);
        
        if (currentFileName || files.length > 0) {
          if (!currentFileName) {
            currentFileName = files.length === 0 ? 'index.html' : `file${files.length + 1}.js`;
            console.log('Generated filename:', currentFileName);
          }
          files.push({ path: currentFileName, content: unescapeCode(currentCode) });
          console.log('Added file:', currentFileName, 'total files now:', files.length);
          currentFileName = '';
        } else if (currentCode.trim()) {
          codeBlocks.push({ content: unescapeCode(currentCode), lang: currentLang });
          console.log('Added code block, length:', currentCode.length);
        }
        currentCode = '';
      }
    } else if (inCodeBlock) {
      currentCode += (currentCode ? '\n' : '') + line;
    } else {
      if (line.trim().startsWith('- ')) {
        changes.push(line.trim().slice(2));
      } else if (line.trim().startsWith('### ')) {
        currentFileName = line.trim().slice(4).trim();
        console.log('Found filename from ###:', currentFileName);
      }
      currentNonCode += (currentNonCode ? '\n' : '') + line;
    }
  }

  if (currentNonCode.trim()) {
    nonCodeParts.push(currentNonCode.trim());
  }

  let code = originalCode;
  let explanation = 'AI已完成代码升级';

  if (codeBlocks.length > 0) {
    const validCodeBlocks = codeBlocks.filter(block => isCodeLike(block.content) || block.content.length > 100);
    
    if (validCodeBlocks.length > 0) {
      const longestCodeBlock = validCodeBlocks.reduce((a, b) => 
        a.content.length > b.content.length ? a : b
      );
      code = longestCodeBlock.content;
      console.log('Selected longest code block as code, length:', code.length);
    } else {
      code = codeBlocks[0].content;
      console.log('Selected first code block as code, length:', code.length);
    }
  }

  if (nonCodeParts.length > 0) {
    const explanationParts = nonCodeParts.filter(part => isExplanationLike(part) || (part.length > 0 && part.length < 3000));
    if (explanationParts.length > 0) {
      explanation = explanationParts.join('\n\n');
      console.log('Found explanation, length:', explanation.length);
    }
  }

  if (code === originalCode && nonCodeParts.length > 0) {
    const candidateCode = nonCodeParts.find(part => isCodeLike(part));
    if (candidateCode) {
      code = candidateCode;
      console.log('Found code in non-code parts, length:', code.length);
      const remainingParts = nonCodeParts.filter(part => part !== candidateCode);
      if (remainingParts.length > 0) {
        explanation = remainingParts.join('\n\n');
      }
    }
  }

  if (codeBlocks.length > 1 && explanation === 'AI已完成代码升级') {
    const explanationCandidate = codeBlocks.find(block => !isCodeLike(block.content) && block.content.length < 2000);
    if (explanationCandidate) {
      explanation = explanationCandidate.content;
      console.log('Found explanation in code blocks, length:', explanation.length);
    }
  }

  if (!explanation || explanation.trim() === '' || isCodeLike(explanation)) {
    explanation = 'AI已完成代码升级';
  }
  
  if (changes.length === 0) {
    changes.push('代码已升级');
  }

  if (!code || code.trim() === '') {
    code = originalCode;
  }

  console.log('=== parseMarkdownResponse Summary ===');
  console.log('Explanation length:', explanation.length);
  console.log('Changes count:', changes.length);
  console.log('Files count:', files.length);
  console.log('Files:', files.map(f => ({ path: f.path, length: f.content.length })));
  console.log('Single-file code length:', code?.length);
  console.log('Code blocks found:', codeBlocks.length);
  console.log('Non-code parts found:', nonCodeParts.length);

  if (files.length > 0) {
    return {
      type: 'multi-file',
      files,
      entryFile,
      explanation,
      changes
    };
  } else {
    return {
      type: 'single-file',
      code,
      explanation,
      changes
    };
  }
}

function fallbackParse(text: string, originalCode: string): GeneratedProject {
  console.log('Using fallbackParse');
  
  let code = originalCode;
  let explanation = 'AI已完成代码升级（备用解析）';
  const changes: string[] = ['代码已升级'];
  
  // 简单地提取所有代码块
  const codeBlockRegex = /```(?:html|javascript|js|css)?\s*([\s\S]*?)```/g;
  let match;
  let lastCodeBlock = '';
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    lastCodeBlock = match[1].trim();
  }
  
  if (lastCodeBlock && lastCodeBlock.length > 100) {
    console.log('Found code block in fallback, length:', lastCodeBlock.length);
    code = lastCodeBlock;
  } else {
    console.log('No valid code block found, using original');
  }
  
  return {
    type: 'single-file',
    code,
    explanation,
    changes
  };
}

function tryParseJson(text: string, originalCode: string): GeneratedProject | null {
  let jsonStr = text.trim();
  
  let braceCount = 0;
  let startIndex = -1;
  let endIndex = -1;
  
  for (let i = 0; i < jsonStr.length; i++) {
    if (jsonStr[i] === '{') {
      if (braceCount === 0) startIndex = i;
      braceCount++;
    } else if (jsonStr[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        endIndex = i + 1;
        break;
      }
    }
  }
  
  if (startIndex !== -1 && endIndex !== -1) {
    jsonStr = jsonStr.substring(startIndex, endIndex);
  }
  
  try {
    const parsed = JSON.parse(jsonStr);
    
    const unescapeCode = (str: string): string => {
      return str
        .replace(/\\\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\\\\t/g, '\t')
        .replace(/\\t/g, '\t')
        .replace(/\\\\"/g, '"')
        .replace(/\\"/g, '"')
        .replace(/\\\\'/g, "'")
        .replace(/\\'/g, "'")
        .replace(/\\\\\\/g, '/')
        .replace(/\\\//g, '/');
    };
    
    if (parsed.code) {
      parsed.code = unescapeCode(parsed.code);
    }
    
    if (parsed.files && Array.isArray(parsed.files)) {
      parsed.files = parsed.files.map((f: any) => ({
        path: f.path,
        content: f.content ? unescapeCode(f.content) : ''
      }));
    }
    
    if (!parsed.code && parsed.type === 'single-file') {
      parsed.code = originalCode;
    }
    
    return parsed as GeneratedProject;
  } catch (e) {
    console.log('JSON parse error:', e);
    return null;
  }
}

export interface ChatOptions {
  prompt: string;
  context?: string;
  mode?: ChatMode;
  demoId?: string;
  onChunk?: (chunk: string) => void;
}

export const AiService = {
  /**
   * Generate a complete enhanced project based on original code and selected features
   */
  generateEnhancedProject: async (
    originalCode: string,
    features: { dataStorage: boolean; multiplayer: boolean },
    userRequirements: string = '',
    onProgress?: (step: string, progress: number, codePreview?: string) => void,
    originalFiles?: Array<{ path: string; content: string }>
  ): Promise<GeneratedProject> => {
    onProgress?.('分析原代码结构...', 10);
    await new Promise(r => setTimeout(r, 500));
    onProgress?.('识别核心功能模块...', 15);
    await new Promise(r => setTimeout(r, 500));
    onProgress?.('规划增强方案...', 20);

    const featureDescriptions: string[] = [];
    const apiDocs: string[] = [];

    if (features.dataStorage) {
      featureDescriptions.push('- 长期数据存储：保存用户的学习进度、游戏分数、实验数据等，跨设备持久化');
      apiDocs.push(`
【数据持久化API】
系统已提供完整的数据持久化后端，可通过以下API调用：

基础对象：
- window.TomorrowAI.apiBase = API基础路径（如 '/api/v1'）
- window.TomorrowAI.demoId = 当前演示程序ID
- window.TomorrowAI.getToken() = 获取用户认证token

数据存储API：
1. 保存数据
   POST /api/v1/demo-features/{demoId}/data
   Body: { key: "myKey", value: { score: 100 } }

2. 获取数据
   GET /api/v1/demo-features/{demoId}/data/{key}
   
3. 获取所有数据
   GET /api/v1/demo-features/{demoId}/data

重要：所有API请求需要在headers中添加 'Authorization: Bearer {token}'
示例代码：
async function saveMyData(key, value) {
  const token = window.TomorrowAI.getToken();
  await fetch(window.TomorrowAI.apiBase + '/demo-features/' + window.TomorrowAI.demoId + '/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ key, value })
  });
}

async function getMyData(key) {
  const token = window.TomorrowAI.getToken();
  const res = await fetch(window.TomorrowAI.apiBase + '/demo-features/' + window.TomorrowAI.demoId + '/data/' + key, {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.json();
  return data.data;
}`);
    }

    if (features.multiplayer) {
      featureDescriptions.push('- 多人协作与互动：创建房间、加入房间、支持多人同步游戏和学习');
      apiDocs.push(`
【多人协作API】
系统已提供完整的多人协作后端，有两种方式可用：

========== 方式一：WebSocket（推荐，毫秒级实时！）
连接：ws://{host}/ws?demoId={demoId}&roomId={roomId}&userId={userId}

WebSocket消息格式：
1. 连接成功
   接收: { type: 'connected', message: '连接成功' }

2. 加入房间
   发送: { type: 'join', roomId: 'xxx', demoId: 'xxx', userId: 'xxx' }

3. 离开房间
   发送: { type: 'leave' }

4. 广播消息（给房间所有人）
   发送: { type: 'broadcast', data: { ... } }
   接收: { type: 'broadcast', data: { ... }, timestamp: 123456 }

5. 用户加入/离开通知
   接收: { type: 'userJoined', userId: 'xxx', userCount: 2 }
   接收: { type: 'userLeft', userCount: 1 }

WebSocket示例代码：
function connectWebSocket(roomId) {
  const wsUrl = 'ws://' + location.host + '/ws?demoId=' + window.TomorrowAI.demoId + '&roomId=' + roomId + '&userId=' + 'my-user-id';
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket已连接');
  };
  
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    switch(msg.type) {
      case 'connected':
        console.log('连接成功');
        break;
      case 'broadcast':
        handleGameUpdate(msg.data);
        break;
      case 'userJoined':
        console.log('用户加入', msg.userId);
        break;
    }
  };
  
  return ws;
}

function sendState(ws, state) {
  ws.send(JSON.stringify({
    type: 'broadcast',
    data: state
  }));
}

========== 方式二：轮询（兼容性好）
房间管理：
1. 创建房间
   POST /api/v1/demo-features/{demoId}/rooms
   Body: { title: "我的房间", maxPlayers: 4 }

2. 获取房间列表
   GET /api/v1/demo-features/{demoId}/rooms

3. 加入房间
   POST /api/v1/demo-features/{demoId}/rooms/{roomId}/join

4. 离开房间
   POST /api/v1/demo-features/{demoId}/rooms/{roomId}/leave

5. 发送消息/同步状态
   POST /api/v1/demo-features/{demoId}/rooms/{roomId}/message
   Body: { type: "gameState", data: { playerX: 100, playerY: 200 } }

6. 获取房间消息
   GET /api/v1/demo-features/{demoId}/rooms/{roomId}/messages[?since=2026-02-18T10:00:00]

示例代码：
async function createRoom(title) {
  const token = window.TomorrowAI.getToken();
  const res = await fetch(window.TomorrowAI.apiBase + '/demo-features/' + window.TomorrowAI.demoId + '/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ title, maxPlayers: 4 })
  });
  return (await res.json()).data;
}

async function sendGameState(roomId, state) {
  const token = window.TomorrowAI.getToken();
  await fetch(window.TomorrowAI.apiBase + '/demo-features/' + window.TomorrowAI.demoId + '/rooms/' + roomId + '/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ type: 'gameState', data: state })
  });
}
`);
    }

    const isMultiFileProject = originalFiles && originalFiles.length > 0;
    
    let originalProjectContent = '';
    if (isMultiFileProject) {
      originalProjectContent = `【项目文件列表】
${originalFiles!.map(f => `
### ${f.path}
\`\`\`
${f.content}
\`\`\`
`).join('\n')}`;
    } else {
      originalProjectContent = `【原代码】
${originalCode}`;
    }

    const prompt = `你是一个专业的前端开发助手。请根据用户选择的功能，对提供的演示程序代码进行全面升级。

【核心任务 - 最重要！！！】
你要完成的是一个**完整的项目重塑**，基于用户提供的原始程序，通过调用我们提供的后端工具，创造出一个完整的、可运行的新版本。

【========================================】
【📋 项目概览】
【========================================】

【1️⃣ 项目类型】
${isMultiFileProject ? '多文件项目（ZIP）' : '单文件项目'}

【2️⃣ 用户选择的功能】
${features.dataStorage && features.multiplayer ? '✅ 长期数据储存 + ✅ 多人联机' : features.dataStorage ? '✅ 长期数据储存' : '✅ 多人联机'}

【3️⃣ 详细功能说明】
${featureDescriptions.join('\n')}

【4️⃣ 可用的API】
${features.dataStorage ? '- 数据存储API' : ''}
${features.multiplayer ? '- 多人联机API' : ''}

【========================================】

${isMultiFileProject ? `【⚠️⚠️⚠️ 重要 - 多文件项目规则！绝对必须遵守！！！】
⚠️⚠️⚠️ 这是一个多文件项目！
⚠️⚠️⚠️ 你必须返回完整的项目！
⚠️⚠️⚠️ 绝对不能只返回单个文件！

【返回格式要求 - 绝对必须遵守！！！】
- 所有文件都要返回，不管有没有修改！
- 即使文件没有修改也要完整返回！
- 只修改需要修改的文件，但所有文件都要返回！
- 返回完整的可运行项目！
- 每个文件的格式必须是：
  ### 文件路径（例如：index.html 或 assets/style.css）
  \`\`\`
  文件完整内容
  \`\`\`
- 每个文件前必须用 ### 开头，然后是文件路径！
- 所有代码必须用 \`\`\` 包裹！
- 绝对不能遗漏任何文件！
- 绝对必须返回所有文件！
` : `【⚠️ 单文件项目规则】
这是一个单文件项目！你可以返回单个文件！
- 只需要返回修改后的HTML文件即可！
- 格式：\`\`\`html ... \`\`\`
`}

【⚠️⚠️⚠️ 重要！只实现上面选中的功能！未选中的功能绝对不要实现！！！】

${userRequirements ? `【用户具体需求】
${userRequirements}

请严格按照用户的具体需求进行实现！` : ''}

【系统已提供的API（超级简单，直接用！）
系统已经封装好了超级简单的API，直接用 window.TomorrowAI.xxx 就行！

${features.dataStorage ? `====== 数据存储API（最简单的方式）
window.TomorrowAI.storage.set('key', value)    // 保存数据
window.TomorrowAI.storage.get('key')             // 获取数据
window.TomorrowAI.storage.getAll()               // 获取所有数据

示例：
await window.TomorrowAI.storage.set('score', 100);  // 保存分数
const score = await window.TomorrowAI.storage.get('score');  // 读取分数
` : ''}

${features.multiplayer ? `====== 多人联机API（两种方式，推荐用WebSocket！）
方式一：WebSocket（毫秒级实时！超级简单）
const ws = new window.TomorrowAI.WebSocket(
  window.TomorrowAI.demoId,   // demoId（自动有）
  roomId,                      // 房间ID
  'my-user-id'                 // 用户ID
);

ws.onMessage = (data) => {
  // 实时收到数据！
  console.log('收到:', data);
};

ws.onUserJoined = (user) => {
  console.log('用户加入:', user.userId);
};

ws.connect();              // 连接
ws.send({ x: 100 });      // 发送数据
ws.disconnect();           // 断开

方式二：房间API（HTTP轮询）
window.TomorrowAI.rooms.list()           // 获取房间列表
window.TomorrowAI.rooms.create(title)    // 创建房间
window.TomorrowAI.rooms.join(roomId)     // 加入房间
window.TomorrowAI.rooms.leave()           // 离开房间
window.TomorrowAI.rooms.sendMessage(type, data)  // 发送消息
window.TomorrowAI.rooms.getMessages(since)       // 获取新消息
` : ''}

【重要规则 - 极其重要！绝对不能违反！！！】
1. 【最高优先级】绝对、绝对、绝对不要丢失原有代码的核心功能！！！
   - 原有程序的所有功能必须完全保留
   - 在原有代码的基础上**添加**新功能，而不是替换
   - 原有游戏/演示的核心玩法、交互逻辑、UI布局都要完整保留
   
2. 优先使用上面的 window.TomorrowAI.xxx API，不要自己写fetch请求！
3. 如果是对战游戏并且选择了联机功能，要改成真正的联机模式，支持两个电脑玩同一局游戏
4. 要添加相应的UI界面，比如房间列表、创建房间、加入房间等界面（只在选择联机功能时添加）
5. 数据存储要真正集成到游戏逻辑中，保存分数、进度等（只在选择数据存储功能时添加）

${isMultiFileProject ? `6. 【多文件项目特殊规则 - 最最重要！！！绝对必须遵守！！！】
   - 返回完整的项目！
   - 所有文件都要返回！
   - 每个文件的完整内容都要返回！
   - 格式：### 文件路径（例如：index.html 或 assets/style.css）
   - 每个文件前用 ### 文件名
   - 然后用 \`\`\` 包裹完整代码
   - 即使文件没有修改也要完整返回！
   - 完整的项目结构必须返回！
   - 绝对不能只返回单个文件！！！` : `6. 【单文件项目规则】
   - 可以返回单个文件！
   - 只需要返回修改后的HTML文件即可！
   - 格式：\`\`\`html ... \`\`\``}

${originalProjectContent}`;

    onProgress?.('发送请求到AI服务...', 25);
    await new Promise(r => setTimeout(r, 300));
    onProgress?.('AI正在思考中...', 30);

    try {
      let fullResponse = '';
      let chunkCount = 0;
      const response = await AiService.chat({
        prompt,
        mode: 'code-generate',
        onChunk: (chunk) => {
          fullResponse += chunk;
          chunkCount++;
          
          if (chunkCount % 3 === 0) {
            const progress = 30 + Math.min((fullResponse.length / 20000) * 40, 40);
            onProgress?.('正在生成代码... (' + (fullResponse.length / 1024).toFixed(1) + 'KB)', progress, fullResponse);
          }
        }
      });

      onProgress?.('解析AI响应...', 75);
      await new Promise(r => setTimeout(r, 200));

      // 解析Markdown格式的响应
      const textToParse = response || fullResponse;
      let result: GeneratedProject;

      try {
        console.log('=== AI Raw Response ===');
        console.log('Length:', textToParse.length);
        console.log('First 1000 chars:', textToParse.substring(0, 1000));
        console.log('Last 1000 chars:', textToParse.substring(textToParse.length - 1000));
        console.log('======================');
        
        console.log('Attempting to parse AI response, length:', textToParse.length);
        result = parseMarkdownResponse(textToParse, originalCode);
        
        // 验证解析结果
        if (result.type === 'single-file' && (!result.code || result.code.trim() === '')) {
          console.warn('Parsed code is empty, falling back to original');
          result.code = originalCode;
          result.explanation = '解析结果为空，使用原代码';
        }
        
        onProgress?.('解析成功！', 90);
      await new Promise(r => setTimeout(r, 200));
      
      if (isMultiFileProject) {
        if (result.type === 'multi-file' && result.files) {
          console.log('=== Merging multi-file project ===');
          console.log('AI returned files count:', result.files.length);
          console.log('AI returned files:', result.files.map(f => ({ path: f.path, length: f.content.length })));
          console.log('Original files count:', originalFiles!.length);
          
          const modifiedFiles = new Map(result.files.map(f => [f.path, f.content]));
          const finalFiles: Array<{ path: string; content: string }> = [];
          
          originalFiles!.forEach(originalFile => {
            if (modifiedFiles.has(originalFile.path)) {
              finalFiles.push({ path: originalFile.path, content: modifiedFiles.get(originalFile.path)! });
              console.log('Using AI-modified file:', originalFile.path);
            } else {
              finalFiles.push({ path: originalFile.path, content: originalFile.content });
              console.log('Using original file:', originalFile.path);
            }
          });
          
          modifiedFiles.forEach((content, path) => {
            if (!originalFiles!.find(f => f.path === path)) {
              finalFiles.push({ path, content });
              console.log('Adding new file from AI:', path);
            }
          });
          
          result.files = finalFiles;
          console.log('Final files after merge:', result.files.map(f => ({ path: f.path, length: f.content.length })));
          
          if (!result.entryFile || !finalFiles.find(f => f.path === result.entryFile)) {
            const htmlFile = finalFiles.find(f => f.path.endsWith('.html') && !f.path.includes('/'));
            result.entryFile = htmlFile ? htmlFile.path : finalFiles[0].path;
          }
        } else {
          console.log('⚠️⚠️⚠️ AI returned single-file but original is multi-file! Using fallback mechanism! ⚠️⚠️⚠️');
          console.log('Using all original files, only replacing the entry file with AI-modified code');
          
          const finalFiles: Array<{ path: string; content: string }> = [];
          let entryFileReplaced = false;
          
          originalFiles!.forEach(originalFile => {
            if (!entryFileReplaced && originalFile.path.endsWith('.html') && result.code) {
              finalFiles.push({ path: originalFile.path, content: result.code });
              console.log('Replacing entry file with AI code:', originalFile.path);
              entryFileReplaced = true;
            } else {
              finalFiles.push({ path: originalFile.path, content: originalFile.content });
              console.log('Using original file:', originalFile.path);
            }
          });
          
          if (!entryFileReplaced && originalFiles!.length > 0 && result.code) {
            finalFiles[0].content = result.code;
            console.log('Replacing first file with AI code:', originalFiles![0].path);
          }
          
          result.type = 'multi-file';
          result.files = finalFiles;
          const htmlFile = finalFiles.find(f => f.path.endsWith('.html') && !f.path.includes('/'));
          result.entryFile = htmlFile ? htmlFile.path : finalFiles[0].path;
          
          console.log('Fallback merge complete!');
          console.log('Final files:', result.files.map(f => ({ path: f.path, length: f.content.length })));
        }
      }
    } catch (parseError) {
        console.warn('Markdown parse failed, trying fallback strategies:', parseError);
        
        // 备用策略：直接提取所有代码块
        try {
          result = fallbackParse(textToParse, originalCode);
          console.log('Fallback parse succeeded');
        } catch (fallbackError) {
          console.error('Fallback parse also failed:', fallbackError);
          result = {
            type: 'single-file',
            code: originalCode,
            explanation: 'AI生成失败，使用原代码',
            changes: []
          };
        }
      }

      onProgress?.('完成！', 100);
      console.log('generateEnhancedProject returning:', {
        type: result.type,
        codeLength: result.code?.length,
        filesCount: result.files?.length,
        explanation: result.explanation
      });
      return result;
    } catch (error) {
      console.error('Failed to generate enhanced project:', error);
      onProgress?.('出错了，回退到原代码', 100);
      return {
        type: 'single-file',
        code: originalCode,
        explanation: '生成失败，使用原代码',
        changes: []
      };
    }
  },

  /**
   * Main chat method - supports both recommendation and explanation modes
   * 
   * @param options - Chat options including prompt, mode, and demoId
   * @returns Promise with the complete response text
   * 
   * Mode 'recommend' (default): Used on main page to help users discover demos
   * Mode 'explain': Used on demo page to explain code and scientific principles
   */
  chat: async (options: ChatOptions): Promise<string> => {
    const { prompt, context, mode = 'recommend', demoId, onChunk } = options;
    
    console.log('AI Service: Sending request', { mode, demoId, promptLength: prompt.length });
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          context,
          mode,
          demoId
        })
      });
      
      console.log('AI Service: Response status', response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('AI Service: HTTP error', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || '';
              if (content) {
                fullText += content;
                onChunk?.(content);
              }
            } catch (e) {
              console.warn('AI Service: Failed to parse SSE data', line);
            }
          }
        }
      }

      console.log('AI Service: Complete response length', fullText.length);
      return fullText;
    } catch (error) {
      console.error('AI Service: Error', error);
      throw error;
    }
  },

  /**
   * Convenience method for main page recommendations
   */
  recommend: async (
    prompt: string,
    context?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    return AiService.chat({
      prompt,
      context,
      mode: 'recommend',
      onChunk
    });
  },

  /**
   * Convenience method for demo page explanations
   */
  explain: async (
    prompt: string,
    demoId: string,
    context?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    return AiService.chat({
      prompt,
      context,
      mode: 'explain',
      demoId,
      onChunk
    });
  }
};
