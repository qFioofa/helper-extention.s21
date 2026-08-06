import type { Component } from "svelte";
import ParticipantCard from "../ui/islands/features/ParticipantCard.svelte";
import XpPanel from "../ui/islands/features/XpPanel.svelte";
import SkillsPanel from "../ui/islands/features/SkillsPanel.svelte";
import ProjectsPanel from "../ui/islands/features/ProjectsPanel.svelte";
import EventsPanel from "../ui/islands/features/EventsPanel.svelte";
import CampusPanel from "../ui/islands/features/CampusPanel.svelte";
import SearchPanel from "../ui/islands/features/SearchPanel.svelte";
import SettingsPanel from "../ui/islands/features/SettingsPanel.svelte";
import AuthPanel from "../ui/islands/features/AuthPanel.svelte";
import LogsPanel from "../ui/islands/features/LogsPanel.svelte";
import CookiesPanel from "../ui/islands/features/CookiesPanel.svelte";

export type IslandDef = {
	id: string;
	title: string;
	component: Component;
};

export type CategoryDef = {
	id: string;
	title: string;
	icon: string;
	islands: IslandDef[];
};

export const categories: CategoryDef[] = [
	{
		id: "dashboard",
		title: "Дашборд",
		icon: "grid",
		islands: [
			{ id: "participant", title: "Участник", component: ParticipantCard },
			{ id: "xp", title: "Прогресс", component: XpPanel },
			{ id: "projects", title: "Проекты", component: ProjectsPanel },
		],
	},
	{
		id: "profile",
		title: "Профиль",
		icon: "user",
		islands: [
			{ id: "participant", title: "Участник", component: ParticipantCard },
			{ id: "xp", title: "Прогресс", component: XpPanel },
			{ id: "skills", title: "Навыки", component: SkillsPanel },
		],
	},
	{
		id: "projects",
		title: "Проекты",
		icon: "folder",
		islands: [
			{ id: "projects", title: "Проекты", component: ProjectsPanel },
			{ id: "xp", title: "Прогресс", component: XpPanel },
		],
	},
	{
		id: "events",
		title: "События",
		icon: "calendar",
		islands: [{ id: "events", title: "Ближайшие события", component: EventsPanel }],
	},
	{
		id: "campus",
		title: "Кампус",
		icon: "building",
		islands: [{ id: "campus", title: "Кластеры", component: CampusPanel }],
	},
	{
		id: "search",
		title: "Поиск",
		icon: "search",
		islands: [{ id: "search", title: "Поиск участника", component: SearchPanel }],
	},
	{
		id: "logs",
		title: "Логи",
		icon: "terminal",
		islands: [{ id: "logs", title: "Логи", component: LogsPanel }],
	},
	{
		id: "settings",
		title: "Настройки",
		icon: "sliders",
		islands: [{ id: "settings", title: "Настройки", component: SettingsPanel }],
	},
	{
		id: "auth",
		title: "Авторизация",
		icon: "key",
		islands: [
			{ id: "auth", title: "Авторизация", component: AuthPanel },
			{ id: "cookies", title: "Куки", component: CookiesPanel },
		],
	},
];
