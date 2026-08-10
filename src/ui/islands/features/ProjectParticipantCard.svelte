<script lang="ts">
	import { S21_PLATFORM_ORIGIN } from "@qfioofa/s21-api";
	import Icon from "../../shared/Icon.svelte";
	import type { ProjectParticipantSummary } from "../../../api/project";
	import { requestPeerSearch } from "../../../core/stores/peerSearch.svelte";

	let {
		login,
		participant,
	}: {
		login: string;
		participant: ProjectParticipantSummary | null;
	} = $props();

	let copied = $state(false);
	let avatarFailed = $state(false);

	const avatarUrl = $derived(
		!avatarFailed && participant?.avatarUrl ? participant.avatarUrl : null,
	);

	const wave = $derived(participant?.className ?? participant?.parallelName ?? null);
	const campus = $derived(participant?.campus?.shortName ?? null);
	const active = $derived(participant?.status === "ACTIVE");
	const level = $derived(participant?.level ?? null);
	const xp = $derived(participant?.expValue ?? null);

	async function copyLogin() {
		try {
			await navigator.clipboard.writeText(login);
			copied = true;
			setTimeout(() => (copied = false), 1200);
		} catch {
			// буфер обмена может быть недоступен
		}
	}

	function goSearch() {
		requestPeerSearch(login);
	}

	function profileUrl(user: string): string {
		return `${S21_PLATFORM_ORIGIN}/profile/${encodeURIComponent(user)}`;
	}

	function playerColor(user: string): string {
		const palette = [
			"bg-blue-600",
			"bg-emerald-600",
			"bg-violet-600",
			"bg-rose-600",
			"bg-amber-600",
			"bg-cyan-600",
		];
		let h = 0;
		for (let i = 0; i < user.length; i++) h = (h * 31 + user.charCodeAt(i)) >>> 0;
		return palette[h % palette.length];
	}
</script>

<div
	class="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-2 py-2 dark:border-slate-800 dark:bg-slate-800/40"
>
	<!-- Аватар -->
	{#if avatarUrl}
		<img
			src={avatarUrl}
			alt={login}
			width={36}
			height={36}
			class="h-9 w-9 shrink-0 rounded-full object-cover"
			onerror={() => (avatarFailed = true)}
		/>
	{:else}
		<div
			class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full {playerColor(login)}"
		>
			<span class="text-sm font-bold text-white">{login[0]?.toUpperCase() ?? "?"}</span>
		</div>
	{/if}

	<!-- Информация о пользователе -->
	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-1.5">
			<a
				href={profileUrl(login)}
				target="_blank"
				rel="noopener noreferrer"
				class="truncate text-sm font-bold text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
				title="Открыть профиль на платформе"
			>
				{login}
			</a>
			<button
				onclick={() => void copyLogin()}
				class="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
				title="Скопировать ник"
			>
				<Icon name={copied ? "check" : "copy"} size={12} />
			</button>
			<button
				onclick={goSearch}
				class="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400"
				title="Искать пира в расширении"
			>
				<Icon name="search" size={12} />
			</button>
		</div>

  <!-- Волна и кампус -->
  <p class="truncate text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">
    {#if wave}
      <span>{wave}</span>
      {#if campus}<span> · {campus}</span>{/if}
    {/if}
  </p>

  <!-- Кнопка для подробной информации -->
  <button
    onclick={() => {
      const details = document.getElementById(`participant-details-${login}`);
      if (details) details.classList.toggle('hidden');
    }}
    class="text-[9px] text-blue-600 hover:underline dark:text-blue-400"
  >
    Подробнее
  </button>

  <!-- Скрытая информация (уровень, XP) -->
  <div id={`participant-details-${login}`} class="hidden mt-0.5">
    <p class="truncate text-[10px] text-slate-500 dark:text-slate-400">
      {#if level != null}
        <span>Ур. {level}</span>
      {/if}
      {#if xp != null}
        <span> · {xp.toLocaleString()} XP</span>
      {/if}
    </p>
  </div>
	</div>

  <!-- Статус активности -->
  <span
    class="shrink-0 rounded-full p-0.5"
    title={active ? "Активен" : "Не активен"}
  >
    <Icon name={active ? "check-circle" : "minus-circle"} size={12} class={active
      ? 'text-emerald-500'
      : 'text-slate-400'}
    />
  </span>
</div>
