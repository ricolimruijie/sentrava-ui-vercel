<script setup>
import { IconRefresh, IconCheck, IconX, IconChevronDown, IconInfoCircle } from '@tabler/icons-vue'
import { scanDot, to24Hour } from '@/composables/useScanTimeline'

// The "Scan timeline" card shared by the asset detail pages: the list of scans
// with the retry pill on failed ones, the "N more" scroll hint, and the Re-scan /
// Stop scanning button. `timeline` is what useScanTimeline() returns.
const props = defineProps({
  timeline: { type: Object, required: true },
  canRescan: { type: Boolean, default: false },   // show the Re-scan button
  canStop: { type: Boolean, default: false },     // continuous target: show Stop scanning while a scan runs
  // Domain / Network style: the button sits directly in the card (no actions wrapper) and
  // Re-scan carries a refresh icon.
  compact: { type: Boolean, default: false },
})

const {
  scans, selectedScan, recurrenceLabel, tlRef, tlRemaining, tlAtEnd,
  updateTimelineHint, scrollTimelineMore, rbState, rbConfirming, retryDoneIndex,
  openRescanConfirm, confirmRescan, cancelRescan, openStopConfirm,
  pendingRescanType, rescanLoading, stopLoading, scanInProgress, timelineStopped, hasActiveScan,
} = props.timeline
</script>

<template>
  <section class="side-card">
    <div class="scan-timeline__head">
      <h2 class="scan-timeline__section">Scan timeline</h2>
      <span class="scan-timeline__count">{{ scans.length }} scans</span>
    </div>
    <p v-if="recurrenceLabel" class="scan-timeline__recurrence">Repeats {{ recurrenceLabel.toLowerCase() }}</p>

    <div class="scan-timeline__scrollwrap">
      <div ref="tlRef" class="scan-timeline__scroll" @scroll="updateTimelineHint">
        <div class="scan-timeline__rail" />
        <button
          v-for="(s, i) in scans"
          :key="s.id"
          type="button"
          class="scan-timeline__item"
          :class="{ 'scan-timeline__item--active': i === selectedScan, 'scan-timeline__item--disabled': s.status === 'Scanning' || s.status === 'Queue' || s.status === 'Waiting' }"
          :disabled="s.status === 'Scanning' || s.status === 'Queue' || s.status === 'Waiting'"
          @click="selectedScan = i"
        >
          <span class="scan-timeline__dot" :style="{ background: scanDot[s.status] ?? '#9aa5b1' }" />
          <span class="scan-timeline__meta">
            <span class="scan-timeline__date">{{ to24Hour(s.date) }}</span>
            <span class="scan-timeline__status">{{ rbConfirming(i) ? 'Retry this scan?' : s.status }}</span>
          </span>
          <template v-if="s.status === 'Failed' || retryDoneIndex === i">
            <div class="rb-pill" :class="rbState(i)">
              <button
                type="button"
                class="rb-sync"
                title="Retry scan"
                aria-label="Retry scan"
                :tabindex="rbState(i) === 'is-idle' ? 0 : -1"
                @click.stop="openRescanConfirm(i)"
              >
                <IconRefresh :size="12" />
              </button>
              <button
                type="button"
                class="rb-ok"
                title="Confirm retry"
                aria-label="Confirm retry"
                :tabindex="rbState(i) === 'is-confirm' ? 0 : -1"
                @click.stop="confirmRescan"
              >
                <IconCheck :size="12" class="rb-tick" />
                <span class="rb-spinner" aria-hidden="true" />
              </button>
              <button
                type="button"
                class="rb-no"
                title="Cancel retry"
                aria-label="Cancel retry"
                :tabindex="rbState(i) === 'is-confirm' ? 0 : -1"
                @click.stop="cancelRescan"
              >
                <IconX :size="12" />
              </button>
            </div>
          </template>
        </button>
      </div>
      <button
        v-show="!tlAtEnd"
        type="button"
        class="scan-timeline__more"
        @click="scrollTimelineMore"
      >
        {{ tlRemaining }} more <IconChevronDown :size="16" />
      </button>
    </div>

    <div :class="compact ? 'scan-actions--bare' : 'scan-main__actions'">
      <Transition name="rescan-swap" mode="out-in">
        <div v-if="timelineStopped" key="stopped" class="scan-stopped-note">
          <IconInfoCircle :size="16" class="scan-stopped-note__icon" />
          <span>Scanning for this target has been stopped and cannot be restarted.</span>
        </div>
        <button
          v-else-if="scanInProgress"
          key="scanning"
          type="button"
          class="btn-register btn-register--block btn-register--scanning"
          disabled
        >
          Scan in progress
        </button>
        <div v-else-if="pendingRescanType === 'main' || pendingRescanType === 'stop'" key="confirm" class="rescan-confirm-inline">
          <button
            type="button"
            class="btn-register btn-register--block btn-register--cancel"
            :disabled="rescanLoading || stopLoading"
            @click="cancelRescan"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn-register btn-register--block btn-register--proceed"
            :disabled="rescanLoading || stopLoading"
            @click="confirmRescan"
          >
            <span v-if="rescanLoading || stopLoading" class="btn-register__spinner" aria-hidden="true" />
            <span v-else>Proceed</span>
          </button>
        </div>
        <button
          v-else-if="canStop && hasActiveScan"
          key="stop"
          type="button"
          class="btn-register btn-register--block"
          @click="openStopConfirm"
        >
          Stop scanning
        </button>
        <button
          v-else-if="canRescan"
          key="rescan"
          type="button"
          class="btn-register btn-register--block"
          @click="() => openRescanConfirm()"
        >
          <template v-if="compact"><IconRefresh :size="14" /> Re-scan</template>
          <template v-else>Re-scan</template>
        </button>
      </Transition>
    </div>
  </section>
</template>

<style scoped lang="scss" src="./ScanTimelineCard.scss"></style>
