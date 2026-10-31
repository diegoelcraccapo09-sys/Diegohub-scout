--!strict
-- DIEGO HUB | Roblox Studio starter
-- Install as a LocalScript in StarterPlayer > StarterPlayerScripts.
-- For an experience you own or are authorized to develop.
-- This does not inspect or control other Roblox experiences.

local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local previous = playerGui:FindFirstChild("DiegoHub")
if previous then previous:Destroy() end

local function make(className: string, props: {[string]: any}, parent: Instance?): Instance
	local object = Instance.new(className)
	for key, value in pairs(props) do
		(object :: any)[key] = value
	end
	if parent then object.Parent = parent end
	return object
end

local C = {
	bg = Color3.fromRGB(12, 10, 19), panel = Color3.fromRGB(22, 18, 33),
	panel2 = Color3.fromRGB(31, 25, 46), line = Color3.fromRGB(58, 46, 78),
	text = Color3.fromRGB(246, 241, 255), muted = Color3.fromRGB(169, 157, 190),
	purple = Color3.fromRGB(157, 91, 255), cyan = Color3.fromRGB(93, 215, 238),
	green = Color3.fromRGB(83, 218, 151), gold = Color3.fromRGB(255, 203, 108),
}

local gui = make("ScreenGui", {
	Name = "DiegoHub", ResetOnSpawn = false, IgnoreGuiInset = false,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
}, playerGui) :: ScreenGui

local viewport = workspace.CurrentCamera and workspace.CurrentCamera.ViewportSize or Vector2.new(900, 600)
local compact = viewport.X < 620
local panelWidth = math.max(320, math.min(560, viewport.X - 24))
local panelHeight = math.max(300, math.min(410, viewport.Y - 70))

local main = make("Frame", {
	Name = "Main", AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5),
	Size = UDim2.fromOffset(panelWidth, panelHeight), BackgroundColor3 = C.bg, BorderSizePixel = 0,
}, gui) :: Frame
make("UICorner", {CornerRadius = UDim.new(0, 14)}, main)
make("UIStroke", {Color = C.line, Thickness = 1.2, Transparency = 0.15}, main)

local top = make("Frame", {
	Name = "TopBar", Size = UDim2.new(1, 0, 0, 48), BackgroundColor3 = C.panel, BorderSizePixel = 0,
}, main) :: Frame
make("UICorner", {CornerRadius = UDim.new(0, 14)}, top)
make("TextLabel", {
	BackgroundTransparency = 1, Position = UDim2.fromOffset(14, 0), Size = UDim2.new(1, -105, 1, 0),
	Font = Enum.Font.GothamBold, Text = "👑  DIEGO HUB  /  STUDIO EDITION",
	TextColor3 = C.text, TextSize = compact and 11 or 13, TextXAlignment = Enum.TextXAlignment.Left,
}, top)

local minimize = make("TextButton", {
	Name = "Minimize", AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -12, 0.5, 0),
	Size = UDim2.fromOffset(32, 28), BackgroundColor3 = C.panel2, Text = "—",
	TextColor3 = C.text, Font = Enum.Font.GothamBold, TextSize = 16, BorderSizePixel = 0,
}, top) :: TextButton
make("UICorner", {CornerRadius = UDim.new(0, 8)}, minimize)

local body = make("Frame", {
	Name = "Body", Position = UDim2.fromOffset(0, 48), Size = UDim2.new(1, 0, 1, -48),
	BackgroundTransparency = 1,
}, main)
local navWidth = compact and 94 or 132
local nav = make("Frame", {
	Name = "Navigation", Size = UDim2.new(0, navWidth, 1, 0), BackgroundColor3 = C.panel, BorderSizePixel = 0,
}, body)
make("UIListLayout", {Padding = UDim.new(0, 7), SortOrder = Enum.SortOrder.LayoutOrder}, nav)
make("UIPadding", {PaddingTop = UDim.new(0, 12), PaddingLeft = UDim.new(0, 8), PaddingRight = UDim.new(0, 8)}, nav)

local content = make("ScrollingFrame", {
	Name = "Content", Position = UDim2.new(0, navWidth + 1, 0, 0),
	Size = UDim2.new(1, -navWidth - 1, 1, 0), BackgroundTransparency = 1, BorderSizePixel = 0,
	ScrollBarThickness = 4, ScrollBarImageColor3 = C.purple, CanvasSize = UDim2.new(),
	AutomaticCanvasSize = Enum.AutomaticSize.Y,
}, body) :: ScrollingFrame
make("UIPadding", {
	PaddingTop = UDim.new(0, 14), PaddingBottom = UDim.new(0, 14),
	PaddingLeft = UDim.new(0, 13), PaddingRight = UDim.new(0, 13),
}, content)
local contentLayout = make("UIListLayout", {Padding = UDim.new(0, 9), SortOrder = Enum.SortOrder.LayoutOrder}, content)

local function label(parent: Instance, text: string, size: number?, color: Color3?, height: number?): TextLabel
	return make("TextLabel", {
		BackgroundTransparency = 1, Size = UDim2.new(1, 0, 0, height or 26),
		Font = Enum.Font.Gotham, Text = text, TextColor3 = color or C.text,
		TextSize = size or 13, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left,
		TextYAlignment = Enum.TextYAlignment.Center,
	}, parent) :: TextLabel
end

local function card(parent: Instance, height: number?): Frame
	local result = make("Frame", {
		Size = UDim2.new(1, 0, 0, height or 66), BackgroundColor3 = C.panel, BorderSizePixel = 0,
	}, parent) :: Frame
	make("UICorner", {CornerRadius = UDim.new(0, 10)}, result)
	make("UIPadding", {
		PaddingTop = UDim.new(0, 8), PaddingBottom = UDim.new(0, 8),
		PaddingLeft = UDim.new(0, 10), PaddingRight = UDim.new(0, 10),
	}, result)
	make("UIListLayout", {Padding = UDim.new(0, 3), SortOrder = Enum.SortOrder.LayoutOrder}, result)
	return result
end

local function actionButton(parent: Instance, text: string, callback: () -> ()): TextButton
	local button = make("TextButton", {
		Size = UDim2.new(1, 0, 0, 34), BackgroundColor3 = C.panel2, BorderSizePixel = 0,
		Font = Enum.Font.GothamSemibold, Text = text, TextColor3 = C.text,
		TextSize = 12, TextWrapped = true, AutoButtonColor = true,
	}, parent) :: TextButton
	make("UICorner", {CornerRadius = UDim.new(0, 8)}, button)
	button.Activated:Connect(callback)
	return button
end

local currentTab = "Inicio"
local progressDone: {[string]: boolean} = {}
local minimized = false

local function clearContent()
	for _, child in ipairs(content:GetChildren()) do
		if child ~= contentLayout and child:IsA("GuiObject") then child:Destroy() end
	end
end

local function heading(text: string, subtitle: string?)
	label(content, text, 18, C.cyan, 30).Font = Enum.Font.GothamBold
	if subtitle then label(content, subtitle, 11, C.muted, 34) end
end

local function renderHome()
	heading("Panel principal", "Base funcional para una experiencia propia de Roblox.")
	local profile = card(content, 84)
	label(profile, "JUGADOR", 10, C.muted, 17)
	label(profile, player.DisplayName .. "  @" .. player.Name, 15, C.text, 24).Font = Enum.Font.GothamBold
	label(profile, "Diego Hub Studio Edition · interfaz local", 10, C.muted, 18)

	local stats = card(content, 84)
	label(stats, "ESTADO DEL PERSONAJE", 10, C.muted, 17)
	local statText = label(stats, "Cargando personaje...", 12, C.text, 42)
	local function updateStats()
		local character = player.Character
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if humanoid then
			statText.Text = string.format("Vida: %d / %d     Velocidad: %.1f", math.floor(humanoid.Health), math.floor(humanoid.MaxHealth), humanoid.WalkSpeed)
		else
			statText.Text = "Personaje no disponible"
		end
	end
	updateStats()
	player.CharacterAdded:Connect(function()
		task.wait(0.5)
		if statText.Parent then updateStats() end
	end)

	local note = card(content, 80)
	label(note, "IMPORTANTE", 10, C.gold, 17)
	label(note, "No lee datos privados de otros juegos ni ejecuta acciones en experiencias ajenas.", 11, C.muted, 42)
end

local function renderCatalog()
	heading("Catálogo de ejemplo", "Datos demostrativos editables para tu propia experiencia.")
	for _, entry in ipairs({
		{"Huevo básico", "Categoría: común · Ejemplo local"},
		{"Huevo brillante", "Categoría: especial · Ejemplo local"},
		{"Mascota guardiana", "Tipo: compañero · Ejemplo local"},
	}) do
		local item = card(content, 62)
		label(item, entry[1], 13, C.text, 22).Font = Enum.Font.GothamBold
		label(item, entry[2], 10, C.muted, 18)
	end
end

local function renderCalculator()
	heading("Calculadora de probabilidad", "Intentos aproximados según una probabilidad introducida.")
	local box = card(content, 148)
	label(box, "Probabilidad por intento (%)", 11, C.muted, 20)
	local input = make("TextBox", {
		Size = UDim2.new(1, 0, 0, 32), BackgroundColor3 = C.bg, BorderSizePixel = 0,
		Font = Enum.Font.Gotham, Text = "5", TextColor3 = C.text, TextSize = 13,
		PlaceholderText = "Ej. 5", ClearTextOnFocus = false,
	}, box) :: TextBox
	make("UICorner", {CornerRadius = UDim.new(0, 7)}, input)
	local output = label(box, "Resultado: introduce un valor entre 0 y 100.", 10, C.cyan, 24)
	actionButton(box, "CALCULAR 50% DE PROBABILIDAD", function()
		local chance = tonumber(input.Text)
		if not chance or chance <= 0 or chance > 100 then
			output.Text = "Introduce un porcentaje mayor que 0 y hasta 100."
			return
		end
		local p = chance / 100
		local attempts = p == 1 and 1 or math.ceil(math.log(0.5) / math.log(1 - p))
		output.Text = string.format("Aproximadamente %d intentos para alcanzar un 50%% acumulado.", attempts)
	end)
	local note = card(content, 60)
	label(note, "Estimación matemática; no es una predicción ni una garantía.", 10, C.muted, 38)
end

local function renderProgress()
	heading("Progreso personal", "Lista local de objetivos de desarrollo.")
	local tasks = {
		"Configurar el proyecto en Studio", "Crear el catálogo propio",
		"Probar la interfaz en móvil", "Conectar datos validados desde el servidor",
	}
	for _, taskName in ipairs(tasks) do
		local item = card(content, 56)
		local button = actionButton(item, (progressDone[taskName] and "✓  " or "○  ") .. taskName, function()
			progressDone[taskName] = not progressDone[taskName]
			renderProgress()
		end)
		button.BackgroundColor3 = progressDone[taskName] and Color3.fromRGB(24, 65, 53) or C.panel2
	end
	local count = 0
	for _, done in pairs(progressDone) do if done then count += 1 end end
	label(content, string.format("%d / %d objetivos completados", count, #tasks), 11, C.cyan, 24)
end

local function renderSettings()
	heading("Ajustes", "Preferencias de esta interfaz.")
	local about = card(content, 82)
	label(about, "DIEGO HUB · STUDIO EDITION", 11, C.gold, 20)
	label(about, "Versión inicial · sin cargadores remotos, credenciales ni acceso a cuentas.", 10, C.muted, 40)
end

local renderers: {[string]: () -> ()} = {
	Inicio = renderHome, Catálogo = renderCatalog, Calculadora = renderCalculator,
	Progreso = renderProgress, Ajustes = renderSettings,
}

local function showTab(tabName: string)
	currentTab = tabName
	clearContent()
	local renderer = renderers[tabName]
	if renderer then renderer() end
	for _, child in ipairs(nav:GetChildren()) do
		if child:IsA("TextButton") then
			child.BackgroundColor3 = child.Name == tabName and C.purple or C.panel2
		end
	end
end

for index, tabName in ipairs({"Inicio", "Catálogo", "Calculadora", "Progreso", "Ajustes"}) do
	local button = make("TextButton", {
		Name = tabName, LayoutOrder = index, Size = UDim2.new(1, 0, 0, 34),
		BackgroundColor3 = tabName == currentTab and C.purple or C.panel2,
		BorderSizePixel = 0, Font = Enum.Font.GothamSemibold, Text = tabName,
		TextColor3 = C.text, TextSize = compact and 10 or 12, AutoButtonColor = true,
	}, nav) :: TextButton
	make("UICorner", {CornerRadius = UDim.new(0, 8)}, button)
	button.Activated:Connect(function() showTab(tabName) end)
end

minimize.Activated:Connect(function()
	minimized = not minimized
	body.Visible = not minimized
	main.Size = minimized and UDim2.fromOffset(panelWidth, 48) or UDim2.fromOffset(panelWidth, panelHeight)
	minimize.Text = minimized and "+" or "—"
end)

-- Drag from the top bar with mouse or touch.
local dragging = false
local dragStart = Vector2.zero
local startPosition = UDim2.new()
top.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
		dragging = true
		dragStart = input.Position
		startPosition = main.Position
		input.Changed:Connect(function()
			if input.UserInputState == Enum.UserInputState.End then dragging = false end
		end)
	end
end)
UserInputService.InputChanged:Connect(function(input)
	if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
		local delta = input.Position - dragStart
		main.Position = UDim2.new(startPosition.X.Scale, startPosition.X.Offset + delta.X, startPosition.Y.Scale, startPosition.Y.Offset + delta.Y)
	end
end)

showTab("Inicio")
print("[Diego Hub] Studio Edition loaded for " .. player.Name)
