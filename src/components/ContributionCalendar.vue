<template>
  <div class="calendar-wrapper">
    <div class="calendar-header">
      <button @click="changeMonth(-1)">&lt;</button>
      <span>{{ currentYear }}年{{ currentMonth + 1 }}月</span>
      <button @click="changeMonth(1)">&gt;</button>
    </div>
    <div class="calendar">
      <div class="weekdays">
        <div v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">{{ day }}</div>
      </div>
      <div class="days">
        <div
          v-for="{ date, count, isCurrentMonth } in calendarDays"
          :key="date"
          class="day"
          :class="{
            'has-memos': count > 0,
            'different-month': !isCurrentMonth,
            [`level-${getLevel(count)}`]: count > 0,
            'today': isToday(date)
          }"
          @click="selectDate(date)"
        >
          {{ new Date(date).getDate() }}
        </div>
      </div>
    </div>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-box level-0"></div>
        <span>0</span>
      </div>
      <div class="legend-item">
        <div class="legend-box level-1"></div>
        <span>1-3</span>
      </div>
      <div class="legend-item">
        <div class="legend-box level-2"></div>
        <span>4-7</span>
      </div>
      <div class="legend-item">
        <div class="legend-box level-3"></div>
        <span>8-10</span>
      </div>
      <div class="legend-item">
        <div class="legend-box level-4"></div>
        <span>10+</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const currentDate = ref(new Date())
const memoStats = ref<Record<string, number>>({})

const emit = defineEmits<{
  (e: 'dateSelect', date: string): void
}>()

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days = []
  
  // 获取月初是星期几 (0-6, 0 = 周日)
  let firstDayWeekday = firstDay.getDay()
  
  // 计算需要显示的上个月的天数（如果是周日，需要显示前面6天）
  const daysFromPrevMonth = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1
  
  // 添加上个月的日期
  for (let i = daysFromPrevMonth; i > 0; i--) {
    const date = new Date(year, month, -i + 1)
    days.push({
      date: formatDate(date),
      count: memoStats.value[formatDate(date)] || 0,
      isCurrentMonth: false
    })
  }
  
  // 添加当前月的日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date: formatDate(date),
      count: memoStats.value[formatDate(date)] || 0,
      isCurrentMonth: true
    })
  }
  
  // 计算需要显示的下个月的天数
  const lastDayWeekday = lastDay.getDay()
  const daysFromNextMonth = lastDayWeekday === 0 ? 0 : 7 - lastDayWeekday
  
  // 添加下个月的日期
  for (let i = 1; i <= daysFromNextMonth; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date: formatDate(date),
      count: memoStats.value[formatDate(date)] || 0,
      isCurrentMonth: false
    })
  }
  
  return days
})

const changeMonth = (delta: number) => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + delta)
  currentDate.value = newDate
  fetchMemoStats()
}

const selectDate = (date: string) => {
  emit('dateSelect', date)
}

const getLevel = (count: number) => {
  if (count === 0) return 0    // 无记录
  if (count <= 3) return 1     // 1-3条记录
  if (count <= 7) return 2     // 4-7条记录
  if (count <= 10) return 3    // 8-10条记录
  return 4                     // 10条以上记录
}

const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0]
}

const fetchMemoStats = async () => {
  try {
    const year = currentYear.value
    const month = currentMonth.value
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/memos/stats/${year}/${month + 1}`)
    if (!response.ok) throw new Error('Failed to fetch stats')
    memoStats.value = await response.json()
  } catch (error) {
    console.error('Error fetching memo stats:', error)
  }
}

const isToday = (dateStr: string) => {
  const today = new Date()
  const date = new Date(dateStr)
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

// 添加一个测试函数
const testDate = () => {
  const testDay = new Date('2025-01-19')
  console.log('2025-01-19 是星期:', testDay.getDay()) // 0 表示周日
  // 也可以用更直观的方式显示
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  console.log('2025-01-19 是:', weekdays[testDay.getDay()])
}

// 在 onMounted 中调用
onMounted(() => {
  testDate()
  fetchMemoStats()
})
</script>

<style scoped>
.calendar-wrapper {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.calendar-header button {
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 8px;
}

.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
}

.different-month {
  color: #ccc;
}

/* 贡献度日历的颜色等级
 * level-0: 灰色底色，表示当天无记录
 * level-1: 最浅绿色，表示1-3条记录
 * level-2: 浅绿色，表示4-7条记录
 * level-3: 中绿色，表示8-10条记录
 * level-4: 深绿色，表示10条以上记录
 */
.level-0 { background-color: #ebedf0; }  /* 灰色 - 无贡献 */
.level-1 { background-color: #9be9a8; }  /* 最浅绿 - 少量贡献 */
.level-2 { background-color: #40c463; }  /* 浅绿色 - 中等贡献 */
.level-3 { background-color: #30a14e; }  /* 中绿色 - 较多贡献 */
.level-4 { background-color: #216e39; }  /* 深绿色 - 大量贡献 */

.legend {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-box {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.today {
  position: relative;
  border: 2px solid #ff4d4f;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(255, 77, 79, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 77, 79, 0);
  }
}
</style> 