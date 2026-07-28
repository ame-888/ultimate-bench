# Progressive Level Weighting migration report

Generated from the preserved level results. “Previous” reproduces the former arena-specific weighted implementation; new values use universal weights 1, 2, 4, 8, 16. Values show four decimals for auditability; the website displays one decimal.

## Visual Bench

| Model | Previous | Progressive Level Weighting |
| --- | ---: | ---: |
| Muse Spark 1.1 | 6.6220 | 10.0645 |
| GPT-5.4 | 10.4268 | 15.2258 |
| GPT-5.5 Instant (0529) | 5.2805 | 8.0645 |
| GPT-5.4 Thinking Mini | 5.1463 | 7.9677 |
| Claude 4.5 Sonnet (adaptive thinking) | 0.7317 | 1.0323 |
| Claude 4.5 Haiku (adaptive thinking) | 0.3537 | 0.5161 |
| Gemini 3.5 Flash (with code execution) | 11.9878 | 18.5806 |
| Claude 4.6 Sonnet (max thinking) | 1.0732 | 1.6129 |
| Claude 4.6 Sonnet (adaptive thinking) | 0.6463 | 0.9677 |
| Gemini 3.5 Flash | 13.0976 | 18.8065 |
| Gemini 3.1 Pro Preview | 9.4634 | 14.5484 |
| Gemini 3.1 Pro Preview (with code execution) | 9.5000 | 14.6452 |
| Gemini 3.1 Flashlite GA | 5.4634 | 8.3871 |
| Gemini 3.1 Flashlite GA (with code execution) | 5.8537 | 8.9677 |
| Gemini 3.0 Flash Preview (with code execution) | 10.9146 | 16.2258 |
| Gemini 2.5 Pro | 5.9024 | 9.0323 |
| Gemini 3.0 Pro Preview | 6.3293 | 9.6129 |
| Gemini 3.1 Flashlite Preview | 7.1707 | 10.9677 |
| Gemini 3.0 Flash Preview | 9.5122 | 14.2258 |
| Gemini 2.5 Flash | 1.6585 | 2.5806 |
| Grok 4.20 Expert | 0.7561 | 1.1613 |
| Muse Spark (thinking) | 0.0000 | 0.0000 |
| GPT-5.5 Instant (0505) | 3.7439 | 5.8710 |
| Grok 4.3 Fast | 0.2927 | 0.4516 |
| GPT-5.5 | 11.2439 | 16.4839 |
| GPT-5.5 Instant (0624) | 5.2561 | 8.0645 |
| GPT-5.6 Sol (high) | 16.3415 | 22.1935 |
| Claude 5 Fable (high) | 8.5366 | 13.2258 |
| Gemini 3.6 Flash | 10.1098 | 15.2258 |
| Gemini 3.6 Flash (with code execution) | 12.2317 | 18.8710 |
| Claude 4.8 Opus (high) | 8.2439 | 12.7097 |
| Claude 5 Opus (high) | 3.7927 | 5.7419 |
| Grok 4.5 Fast | 1.2195 | 1.8065 |

## Data Retrieval Bench

| Model | Previous | Progressive Level Weighting |
| --- | ---: | ---: |
| Muse Spark 1.1 | 3.7692 | 4.5333 |
| Gemini 3.6 Flash | 6.2564 | 7.4667 |
| Claude 4.6 Sonnet (max thinking) | 4.9231 | 6.0667 |
| GPT-5.5 Instant (0529) | 1.5385 | 2.0000 |
| Gemini 3.5 Flash | 0.8205 | 1.0667 |
| Grok 4.20 Expert | 24.0000 | 24.0000 |
| Grok 4.3 Fast | 5.1538 | 6.4667 |
| Gemini 3.1 Pro Preview | 4.6923 | 5.7333 |
| Muse Spark (thinking) | 0.6667 | 0.8667 |
| Claude 4.6 Sonnet (adaptive thinking) | 2.1795 | 2.7333 |
| GPT-5.5 Instant (0505) | 2.0513 | 2.6667 |
| Gemini 3.1 Flashlite GA | 4.1026 | 5.0667 |
| Gemini 3.0 Flash Preview | 3.1795 | 4.0667 |
| GPT-5.5 | 8.7179 | 10.7333 |
| GPT-5.6 Sol (high) | 17.4872 | 20.7333 |
| Claude 5 Fable (high) | 4.8718 | 6.1333 |
| Claude 4.8 Opus (high) | 0.7179 | 0.9333 |
| Claude 5 Opus (high) | 1.3846 | 1.8000 |

## Chess Bench

| Model | Previous | Progressive Level Weighting |
| --- | ---: | ---: |
| Muse Spark 1.1 | 0.0000 | 0.0000 |
| Gemini 3.1 Flashlite GA | 0.0000 | 0.0000 |
| Grok 4.3 Fast | 0.0000 | 0.0000 |
| Gemini 3.1 Pro Preview | 15.8876 | 21.1935 |
| GPT-5.5 Instant (0505) | 0.0000 | 0.0000 |
| GPT-5.5 Instant (0529) | 0.0000 | 0.0000 |
| Gemini 3.5 Flash | 4.5506 | 6.2581 |
| Claude 4.6 Sonnet (max thinking) | 0.0000 | 0.0000 |
| Claude 4.6 Sonnet (adaptive thinking) | 0.0000 | 0.0000 |
| Muse Spark (thinking) | 0.0674 | 0.0968 |
| Gemini 3.0 Flash Preview | 0.5393 | 0.7742 |
| GPT-5.5 | 5.2584 | 7.1935 |
| GPT-5.6 Sol (high) | 11.2022 | 15.1290 |
| Claude 5 Fable (high) | 3.2697 | 4.4516 |

## Overall and rank migration

| Model | Previous Overall | Previous rank | New Overall | New rank | Rank changed |
| --- | ---: | ---: | ---: | ---: | --- |
| GPT-5.6 Sol (high) | 15.0103 | 1 | 19.3520 | 1 | No |
| Gemini 3.1 Pro Preview | 10.0145 | 2 | 13.8251 | 2 | No |
| GPT-5.5 | 8.4068 | 3 | 11.4703 | 3 | No |
| Gemini 3.5 Flash | 6.1562 | 4 | 8.7104 | 4 | No |
| Claude 5 Fable (high) | 5.5593 | 5 | 7.9369 | 5 | No |
| Gemini 3.0 Flash Preview | 4.4103 | 6 | 6.3556 | 6 | No |
| Muse Spark 1.1 | 3.4637 | 7 | 4.8659 | 7 | No |
| Gemini 3.1 Flashlite GA | 3.1887 | 8 | 4.4846 | 8 | No |
| GPT-5.5 Instant (0529) | 2.2730 | 9 | 3.3548 | 9 | No |
| Claude 4.6 Sonnet (max thinking) | 1.9987 | 10 | 2.5599 | 11 | Yes |
| GPT-5.5 Instant (0505) | 1.9317 | 11 | 2.8459 | 10 | Yes |
| Grok 4.3 Fast | 1.8155 | 12 | 2.3061 | 12 | No |
| Claude 4.6 Sonnet (adaptive thinking) | 0.9419 | 13 | 1.2337 | 13 | No |
| Muse Spark (thinking) | 0.2447 | 14 | 0.3211 | 14 | No |

### Models whose canonical rank changed

- Claude 4.6 Sonnet (max thinking): 10 → 11
- GPT-5.5 Instant (0505): 11 → 10
